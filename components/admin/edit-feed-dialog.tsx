"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi, countryApi, feedApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { AdminFeedRequest, FeedDetails, Country } from "@/lib/types";

const feedFormSchema = z.object({
  fd_code: z.string().min(1, "Feed code is required"),
  fd_name: z.string().min(1, "Feed name is required"),
  fd_category: z.string().min(1, "Feed category is required"),
  fd_type: z.string().min(1, "Feed type is required"),
  fd_country_name: z.string().min(1, "Country is required"),
  fd_country_cd: z.string().optional(),
  fd_dm: z.number().optional(),
  fd_ash: z.number().optional(),
  fd_cp: z.number().optional(),
  fd_npn_cp: z.number().optional(),
  fd_ee: z.number().optional(),
  fd_cf: z.number().optional(),
  fd_nfe: z.number().optional(),
  fd_st: z.number().optional(),
  fd_ndf: z.number().optional(),
  fd_hemicellulose: z.number().optional(),
  fd_adf: z.number().optional(),
  fd_cellulose: z.number().optional(),
  fd_lg: z.number().optional(),
  fd_ndin: z.number().optional(),
  fd_adin: z.number().optional(),
  fd_ca: z.number().optional(),
  fd_p: z.number().optional(),
  fd_season: z.string().optional(),
  fd_orginin: z.string().optional(),
  fd_ipb_local_lab: z.string().optional(),
});

type FeedFormValues = z.infer<typeof feedFormSchema>;

interface EditFeedDialogProps {
  feed: FeedDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditFeedDialog({
  feed,
  open,
  onOpenChange,
  onSuccess,
}: EditFeedDialogProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [feedTypes, setFeedTypes] = useState<string[]>([]);
  const [feedCategories, setFeedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedFeedType, setSelectedFeedType] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedFeedType = useDebounce(selectedFeedType, 300);

  const form = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
  });

  const loadCountries = useCallback(async () => {
    try {
      const data = await countryApi.getAllCountries();
      setCountries(data);
    } catch (error) {
      toast.error("Failed to load countries");
    }
  }, []);

  const loadFeedTypes = useCallback(async () => {
    if (!user?.country_id) return;
    try {
      const data = await feedApi.getFeedTypes(user.country_id, user.id);
      setFeedTypes(data);
    } catch (error) {
      toast.error("Failed to load feed types");
    }
  }, [user?.country_id, user?.id]);

  useEffect(() => {
    if (open && user?.is_admin) {
      loadCountries();
      loadFeedTypes();
      if (feed) {
        form.reset({
          fd_code: feed.fd_code?.toString() || "",
          fd_name: feed.fd_name || "",
          fd_category: feed.fd_category || "",
          fd_type: feed.fd_type || "",
          fd_country_name: feed.fd_country_name || "",
          fd_country_cd: feed.fd_country_cd || "",
          fd_dm: feed.fd_dm,
          fd_ash: feed.fd_ash,
          fd_cp: feed.fd_cp,
          fd_npn_cp: feed.fd_npn_cp,
          fd_ee: feed.fd_ee,
          fd_cf: feed.fd_cf,
          fd_nfe: feed.fd_nfe,
          fd_st: feed.fd_st,
          fd_ndf: feed.fd_ndf,
          fd_hemicellulose: feed.fd_hemicellulose,
          fd_adf: feed.fd_adf,
          fd_cellulose: feed.fd_cellulose,
          fd_lg: feed.fd_lg,
          fd_ndin: feed.fd_ndin,
          fd_adin: feed.fd_adin,
          fd_ca: feed.fd_ca,
          fd_p: feed.fd_p,
          fd_season: feed.fd_season,
          fd_orginin: feed.fd_orginin,
          fd_ipb_local_lab: feed.fd_ipb_local_lab,
        });
        if (feed.fd_type) {
          setSelectedFeedType(feed.fd_type);
        }
      }
    }
  }, [open, feed, user, loadCountries, loadFeedTypes, form]);

  // Load categories when debounced feed type changes
  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!user?.country_id || !debouncedFeedType) {
      setFeedCategories([]);
      return;
    }

    setLoadingCategories(true);
    abortControllerRef.current = new AbortController();

    const fetchCategories = async () => {
      try {
        const data = await feedApi.getFeedCategories(
          debouncedFeedType,
          user.country_id!,
          user.id
        );
        if (!abortControllerRef.current?.signal.aborted) {
          setFeedCategories(data.unique_feed_categories || []);
        }
      } catch (error: any) {
        if (error.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
          toast.error("Failed to load feed categories");
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedFeedType, user?.country_id, user?.id]);

  const handleFeedTypeChange = (feedType: string) => {
    form.setValue("fd_type", feedType);
    form.setValue("fd_category", "");
    setSelectedFeedType(feedType);
    setFeedCategories([]);
  };

  const onSubmit = async (data: FeedFormValues) => {
    if (!user?.is_admin || !feed) return;

    setLoading(true);
    try {
      const feedData: AdminFeedRequest = {
        fd_code: data.fd_code,
        fd_name: data.fd_name,
        fd_category: data.fd_category,
        fd_type: data.fd_type,
        fd_country_name: data.fd_country_name,
        fd_country_cd: data.fd_country_cd,
        fd_dm: data.fd_dm,
        fd_ash: data.fd_ash,
        fd_cp: data.fd_cp,
        fd_npn_cp: data.fd_npn_cp,
        fd_ee: data.fd_ee,
        fd_cf: data.fd_cf,
        fd_nfe: data.fd_nfe,
        fd_st: data.fd_st,
        fd_ndf: data.fd_ndf,
        fd_hemicellulose: data.fd_hemicellulose,
        fd_adf: data.fd_adf,
        fd_cellulose: data.fd_cellulose,
        fd_lg: data.fd_lg,
        fd_ndin: data.fd_ndin,
        fd_adin: data.fd_adin,
        fd_ca: data.fd_ca,
        fd_p: data.fd_p,
        fd_season: data.fd_season,
        fd_orginin: data.fd_orginin,
        fd_ipb_local_lab: data.fd_ipb_local_lab,
      };

      await adminApi.updateFeed(user.id, feed.feed_id, feedData);
      toast.success("Feed updated successfully");
      form.reset();
      setSelectedFeedType("");
      setFeedCategories([]);
      setLoadingCategories(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update feed");
    } finally {
      setLoading(false);
    }
  };

  if (!feed) return null;

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when dialog closes without submit
      form.reset();
      setSelectedFeedType("");
      setFeedCategories([]);
      setLoadingCategories(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Feed</DialogTitle>
          <DialogDescription>
            Update feed information in the master database
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fd_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IND-1223" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fd_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Feed name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fd_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Type *</FormLabel>
                    <Select
                      onValueChange={handleFeedTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select feed type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feedTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fd_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("fd_type") || loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={
                              loadingCategories 
                                ? "Loading categories..." 
                                : "Select category"
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feedCategories.length === 0 && !loadingCategories ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No categories available
                          </div>
                        ) : (
                          feedCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fd_country_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-populate country code
                        const selectedCountry = countries.find(c => c.name === value);
                        if (selectedCountry?.country_code) {
                          form.setValue("fd_country_cd", selectedCountry.country_code);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fd_country_cd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IND" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Nutritional Values (Optional)</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fd_dm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dry Matter (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_cp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crude Protein (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_ee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ether Extract (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_ndf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NDF (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_adf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ADF (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_ca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calcium (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fd_p"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phosphorus (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Feed"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

