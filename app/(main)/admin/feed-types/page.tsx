"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { adminApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const feedTypeSchema = z.object({
  type_name: z.string().min(1, "Type name is required"),
  description: z.string().optional(),
  sort_order: z.number().optional(),
});

const feedCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
  feed_type_id: z.string().min(1, "Feed type is required"),
  description: z.string().optional(),
  sort_order: z.number().optional(),
});

type FeedTypeFormValues = z.infer<typeof feedTypeSchema>;
type FeedCategoryFormValues = z.infer<typeof feedCategorySchema>;

export default function AdminFeedTypesPage() {
  const { user } = useAuthStore();
  const [feedTypes, setFeedTypes] = useState<any[]>([]);
  const [feedCategories, setFeedCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const typeForm = useForm<FeedTypeFormValues>({
    resolver: zodResolver(feedTypeSchema),
    defaultValues: {
      type_name: "",
      description: "",
      sort_order: 0,
    },
  });

  const categoryForm = useForm<FeedCategoryFormValues>({
    resolver: zodResolver(feedCategorySchema),
    defaultValues: {
      category_name: "",
      feed_type_id: "",
      description: "",
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (user?.is_admin) {
      loadFeedTypes();
      loadFeedCategories();
    }
  }, [user]);

  const loadFeedTypes = async () => {
    if (!user?.is_admin) return;
    try {
      const data = await adminApi.listFeedTypes(user.id);
      setFeedTypes(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load feed types");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedCategories = async () => {
    if (!user?.is_admin) return;
    try {
      const data = await adminApi.listFeedCategories(user.id);
      setFeedCategories(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load feed categories");
    }
  };

  const handleAddType = async (data: FeedTypeFormValues) => {
    if (!user?.is_admin) return;

    try {
      await adminApi.addFeedType(user.id, data);
      toast.success("Feed type added successfully");
      typeForm.reset();
      setTypeDialogOpen(false);
      loadFeedTypes();
    } catch (error: any) {
      toast.error(error.message || "Failed to add feed type");
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!user?.is_admin || !confirm("Are you sure you want to delete this feed type?")) {
      return;
    }

    try {
      await adminApi.deleteFeedType(user.id, typeId);
      toast.success("Feed type deleted successfully");
      loadFeedTypes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete feed type");
    }
  };

  const handleAddCategory = async (data: FeedCategoryFormValues) => {
    if (!user?.is_admin) return;

    try {
      await adminApi.addFeedCategory(user.id, data);
      toast.success("Feed category added successfully");
      categoryForm.reset();
      setCategoryDialogOpen(false);
      loadFeedCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to add feed category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user?.is_admin || !confirm("Are you sure you want to delete this feed category?")) {
      return;
    }

    try {
      await adminApi.deleteFeedCategory(user.id, categoryId);
      toast.success("Feed category deleted successfully");
      loadFeedCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete feed category");
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed Types & Categories</CardTitle>
          <CardDescription>Manage feed classification hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="types" className="w-full">
            <TabsList>
              <TabsTrigger value="types">Feed Types</TabsTrigger>
              <TabsTrigger value="categories">Feed Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="types" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Feed Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Feed Type</DialogTitle>
                      <DialogDescription>
                        Create a new feed type (e.g., Forage, Concentrate)
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...typeForm}>
                      <form
                        onSubmit={typeForm.handleSubmit(handleAddType)}
                        className="space-y-4"
                      >
                        <FormField
                          control={typeForm.control}
                          name="type_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Forage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={typeForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Optional description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={typeForm.control}
                          name="sort_order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sort Order</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTypeDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Type</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No feed types found
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.type_name}</TableCell>
                          <TableCell>{type.description || "—"}</TableCell>
                          <TableCell>{type.sort_order}</TableCell>
                          <TableCell>
                            <span
                              className={
                                type.is_active
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {type.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteType(type.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Feed Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Feed Category</DialogTitle>
                      <DialogDescription>
                        Create a new feed category for a feed type
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form
                        onSubmit={categoryForm.handleSubmit(handleAddCategory)}
                        className="space-y-4"
                      >
                        <FormField
                          control={categoryForm.control}
                          name="feed_type_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feed Type *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select feed type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {feedTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.type_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="category_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Grain Crop Forage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Optional description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="sort_order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sort Order</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Category</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Feed Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No feed categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.category_name}
                          </TableCell>
                          <TableCell>
                            {category.feed_type?.type_name || "—"}
                          </TableCell>
                          <TableCell>{category.description || "—"}</TableCell>
                          <TableCell>{category.sort_order}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              aria-label={`Delete feed category ${category.category_name}`}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
