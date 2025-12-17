"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recommendationApi, reportApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { useFeedStore } from "@/store/feed-store";
import { useCattleInfoStore } from "@/store/cattle-info-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Save,
  ArrowLeft,
  Leaf,
  DollarSign,
  Milk,
  Scale,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function RecommendationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cattleInfo } = useCattleInfoStore();
  const { selectedFeeds } = useFeedStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const [recommendation, setRecommendation] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const hasValidCattleInfo = cattleInfo && cattleInfo.breed && cattleInfo.breed.length > 0;
    const hasFeeds = selectedFeeds.length > 0;

    if (hasValidCattleInfo && hasFeeds && user && !hasGenerated && !loading) {
      setHasGenerated(true);
      generateRecommendation();
    }
  }, [cattleInfo, selectedFeeds, user, hasGenerated, loading]);

  const generateRecommendation = async () => {
    if (!user || !cattleInfo || selectedFeeds.length === 0) {
      toast.error("Please complete cattle info and select feeds");
      router.push("/cattle-info");
      return;
    }

    setLoading(true);
    try {
      const simulationId = `sim_${Date.now()}`;
      const recommendationData = {
        cattle_info: cattleInfo as any,
        feed_selection: selectedFeeds,
        simulation_id: simulationId,
        user_id: user.id,
      };

      const [recResult, evalResult] = await Promise.allSettled([
        recommendationApi.getRecommendation(recommendationData),
        recommendationApi.getEvaluation(recommendationData),
      ]);

      if (recResult.status === 'fulfilled') {
        setRecommendation(recResult.value);
      } else {
        console.error("Recommendation failed:", recResult.reason);
        toast.error(recResult.reason?.message || "Failed to generate recommendation");
      }

      if (evalResult.status === 'fulfilled') {
        setEvaluation(evalResult.value);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate recommendation");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!recommendation || !user) {
      toast.error("Unable to save report");
      return;
    }

    setSaving(true);
    try {
      const simulationId = recommendation.report_info?.simulation_id || `sim_${Date.now()}`;

      // Use generate-pdf-report endpoint which saves the full recommendation
      const response = await reportApi.generatePdfReport(
        simulationId,
        user.id,
        recommendation
      );

      if (response.success) {
        toast.success("Report saved to your account!");
        setSaved(true);
      } else {
        // Fallback: offer client-side PDF download if backend save fails
        toast.error("Could not save to server. Use 'Download PDF' instead.");
      }
    } catch (error: any) {
      console.error("Save report error:", error);
      toast.error("Could not save to server. Use 'Download PDF' instead.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Dynamic import to reduce bundle size
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      if (!reportRef.current) {
        toast.error("Unable to generate PDF");
        return;
      }

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`feed-recommendation-${recommendation?.report_info?.report_id || 'report'}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="container mx-auto max-w-4xl py-6 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendation Available</h3>
            <p className="text-muted-foreground mb-4">
              Please complete cattle information and select feeds first.
            </p>
            <Button onClick={() => router.push("/cattle-info")}>
              Go to Cattle Info
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report_info, solution_summary, animal_information, least_cost_diet, environmental_impact, total_diet_cost } = recommendation;

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 space-y-6">
      {/* Report Content - Used for PDF generation */}
      <div ref={reportRef} className="space-y-6 bg-background">
        {/* Header */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Feed Recommendation</CardTitle>
                <CardDescription>
                  Generated on {new Date(report_info?.generated_date || Date.now()).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                ID: {report_info?.report_id}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Daily Cost</p>
                  <p className="text-xl font-bold">₹{total_diet_cost || solution_summary?.daily_cost || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Milk className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Milk Production</p>
                  <p className="text-xl font-bold">{solution_summary?.milk_production || animal_information?.milk_production || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Dry Matter Intake</p>
                  <p className="text-xl font-bold">{solution_summary?.dry_matter_intake || 0} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Methane/day</p>
                  <p className="text-xl font-bold">{environmental_impact?.methane_production_grams_per_day || 0}g</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Animal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Breed</p>
                <p className="font-medium">{animal_information?.breed || cattleInfo?.breed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Body Weight</p>
                <p className="font-medium">{animal_information?.body_weight || cattleInfo?.body_weight} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Body Condition</p>
                <p className="font-medium">{animal_information?.bc_score || cattleInfo?.bc_score}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Days in Milk</p>
                <p className="font-medium">{animal_information?.days_in_milk || cattleInfo?.days_in_milk}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parity</p>
                <p className="font-medium">{animal_information?.parity || cattleInfo?.parity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Temperature</p>
                <p className="font-medium">{animal_information?.temperature || cattleInfo?.temperature}°C</p>
              </div>
              <div>
                <p className="text-muted-foreground">Topography</p>
                <p className="font-medium">{animal_information?.topography || cattleInfo?.topography}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Grazing</p>
                <p className="font-medium">{(animal_information?.grazing || cattleInfo?.grazing) ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diet Recommendation Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Diet</CardTitle>
            <CardDescription>
              {least_cost_diet?.length > 0
                ? `${least_cost_diet.length} feed ingredients recommended`
                : "No specific diet formulation available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {least_cost_diet?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feed Name</TableHead>
                    <TableHead className="text-right">Quantity (kg)</TableHead>
                    <TableHead className="text-right">DM Intake (kg)</TableHead>
                    <TableHead className="text-right">Cost (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {least_cost_diet.map((feed: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{feed.feed_name || feed.name || `Feed ${index + 1}`}</TableCell>
                      <TableCell className="text-right">{feed.quantity?.toFixed(2) || feed.amount?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell className="text-right">{feed.dm_intake?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell className="text-right">₹{feed.cost?.toFixed(2) || feed.price?.toFixed(2) || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>The algorithm could not find an optimal diet with the selected feeds.</p>
                <p className="text-sm mt-1">Try adding more variety of feeds (both forages and concentrates).</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environmental Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              Environmental Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">CH₄ Production</p>
                <p className="font-semibold">{environmental_impact?.methane_production_grams_per_day || 0} g/day</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">CH₄ Yield</p>
                <p className="font-semibold">{environmental_impact?.methane_yield_grams_per_kg_dmi || 0} g/kg DMI</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">CH₄ Intensity</p>
                <p className="font-semibold">{environmental_impact?.methane_intensity_grams_per_kg_ecm || 0} g/kg ECM</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs">Conversion Rate</p>
                <p className="font-semibold">{environmental_impact?.methane_conversion_rate_percent || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Outside PDF area */}
      <Separator />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.back()} className="flex-1 sm:flex-none">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-3 flex-1 sm:flex-none sm:ml-auto">
          <Button
            onClick={handleSaveReport}
            disabled={saving || saved || !recommendation?.report_info?.report_id}
            variant={saved ? "outline" : "default"}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? "Saved" : "Save Report"}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="secondary"
            className="flex-1"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
