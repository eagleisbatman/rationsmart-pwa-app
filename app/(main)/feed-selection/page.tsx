"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feedApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { useFeedStore } from "@/store/feed-store";
import { useCattleInfoStore } from "@/store/cattle-info-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedSelectionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cattleInfo } = useCattleInfoStore();
  const { selectedFeeds, addFeed, removeFeed } = useFeedStore();

  const [feedTypes, setFeedTypes] = useState<string[]>([]);
  const [feedCategories, setFeedCategories] = useState<string[]>([]);
  const [feedSubCategories, setFeedSubCategories] = useState<any[]>([]);
  
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedFeedDetails, setSelectedFeedDetails] = useState<any>(null);
  const [pricePerKg, setPricePerKg] = useState(0);
  
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  useEffect(() => {
    if (user?.country_id) {
      loadFeedTypes();
    }
  }, [user]);

  const loadFeedTypes = async () => {
    if (!user?.country_id) return;
    setLoadingTypes(true);
    try {
      const types = await feedApi.getFeedTypes(user.country_id, user.id);
      setFeedTypes(types);
    } catch (error: any) {
      toast.error("Failed to load feed types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadCategories = async (feedType: string) => {
    if (!user?.country_id) return;
    setLoadingCategories(true);
    try {
      const categories = await feedApi.getFeedCategories(
        feedType,
        user.country_id,
        user.id
      );
      setFeedCategories(categories.unique_feed_categories || []);
    } catch (error: any) {
      toast.error("Failed to load feed categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubCategories = async (feedType: string, feedCategory: string) => {
    if (!user?.country_id) return;
    setLoadingSubCategories(true);
    try {
      const subCategories = await feedApi.getFeedSubCategories(
        feedType,
        feedCategory,
        user.country_id,
        user.id
      );
      setFeedSubCategories(subCategories);
    } catch (error: any) {
      toast.error("Failed to load feed subcategories");
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedFeedDetails(null);
    setFeedCategories([]);
    setFeedSubCategories([]);
    if (type) {
      loadCategories(type);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubCategory("");
    setSelectedFeedDetails(null);
    setFeedSubCategories([]);
    if (selectedType && category) {
      loadSubCategories(selectedType, category);
    }
  };

  const handleSubCategoryChange = async (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedFeedDetails(null);
    // Find the feed UUID from the selected subcategory
    const selectedFeed = feedSubCategories.find(
      (f) => f.feed_name === subCategory
    );
    if (selectedFeed && user?.country_id) {
      try {
        const response = await feedApi.getFeedDetails({
          feed_id: selectedFeed.feed_uuid,
          country_id: user.country_id,
          user_id: user.id,
        });
        setSelectedFeedDetails(response.feed_details);
      } catch (error: any) {
        toast.error("Failed to load feed details");
      }
    }
  };

  const handleAddFeed = () => {
    if (!selectedFeedDetails || !pricePerKg) {
      toast.error("Please select a feed and enter price");
      return;
    }
    addFeed({
      feed_id: selectedFeedDetails.feed_id,
      price_per_kg: pricePerKg,
    });
    toast.success("Feed added");
    // Reset form
    setSelectedType("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedFeedDetails(null);
    setPricePerKg(0);
  };

  const handleContinue = () => {
    if (selectedFeeds.length === 0) {
      toast.error("Please add at least one feed");
      return;
    }
    router.push("/recommendation");
  };

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed Selection</CardTitle>
          <CardDescription>
            Select feeds for your cattle feed formulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed Type</Label>
              {loadingTypes ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feed type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedType && (
              <div className="space-y-2">
                <Label>Feed Category</Label>
                {loadingCategories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedCategory}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feed category" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Feed Name</Label>
                {loadingSubCategories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedSubCategory}
                    onValueChange={handleSubCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feed name" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedSubCategories.map((subCat) => (
                        <SelectItem
                          key={subCat.feed_uuid}
                          value={subCat.feed_name}
                        >
                          {subCat.feed_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedFeedDetails && (
              <div className="space-y-2">
                <Label>Price per kg</Label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={pricePerKg || ""}
                  onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
                />
                <Button onClick={handleAddFeed} className="w-full">
                  Add Feed
                </Button>
              </div>
            )}
          </div>

          {selectedFeeds.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Feeds ({selectedFeeds.length})</Label>
              <div className="space-y-2">
                {selectedFeeds.map((feed, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>Feed {index + 1}</span>
                    <span>₹{feed.price_per_kg}/kg</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeed(feed.feed_id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue to Recommendation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

