"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExpandableSection } from "./expandable-section";
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
import { useCattleInfoStore } from "@/store/cattle-info-store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const cattleInfoSchema = z.object({
  breed: z.string().min(1, "Breed is required"),
  bc_score: z.number().min(1).max(5),
  body_weight: z.number().min(350).max(720),
  calving_interval: z.number().min(0),
  bw_gain: z.number().min(0).max(99),
  days_in_milk: z.number().min(0),
  days_of_pregnancy: z.number().min(0),
  distance: z.number().min(0),
  grazing: z.boolean(),
  lactating: z.boolean(),
  fat_milk: z.number().min(0).max(100),
  milk_production: z.number().min(0),
  tp_milk: z.number().min(0).max(100),
  parity: z.number().min(0),
  temperature: z.number(),
  topography: z.string().min(1, "Topography is required"),
});

type CattleInfoFormValues = z.infer<typeof cattleInfoSchema>;

const breeds = [
  "Holstein",
  "Jersey",
  "Brown Swiss",
  "Guernsey",
  "Ayrshire",
  "Other",
];

const topographyOptions = ["Flat", "Hilly", "Mountainous"];

export function CattleInfoForm() {
  const router = useRouter();
  const { setCattleInfo } = useCattleInfoStore();

  const form = useForm<CattleInfoFormValues>({
    resolver: zodResolver(cattleInfoSchema),
    defaultValues: {
      breed: "",
      bc_score: 0,
      body_weight: 0,
      calving_interval: 0,
      bw_gain: 0,
      days_in_milk: 0,
      days_of_pregnancy: 0,
      distance: 0,
      grazing: false,
      lactating: false,
      fat_milk: 0,
      milk_production: 0,
      tp_milk: 0,
      parity: 0,
      temperature: 0,
      topography: "",
    },
  });

  const onSubmit = (data: CattleInfoFormValues) => {
    setCattleInfo(data);
    router.push("/feed-selection");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ExpandableSection title="Animal Characteristics" defaultExpanded={true}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select breed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {breeds.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
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
              name="body_weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="350-720"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bc_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Condition Score (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1-5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bw_gain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Body Weight Gain (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0-99"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ExpandableSection>

        <ExpandableSection title="Milk Production" defaultExpanded={true}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="lactating"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel>Lactating</FormLabel>
                </FormItem>
              )}
            />
            {form.watch("lactating") && (
              <>
                <FormField
                  control={form.control}
                  name="milk_production"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milk Production (L/day)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fat_milk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milk Fat (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tp_milk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milk Protein (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="days_in_milk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days in Milk</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </ExpandableSection>

        <ExpandableSection title="Reproductive Data" defaultExpanded={true}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="parity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calving_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calving Interval (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="days_of_pregnancy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days of Pregnancy</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ExpandableSection>

        <ExpandableSection title="Environment" defaultExpanded={true}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="grazing"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel>Grazing</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topography"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topography</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topography" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topographyOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ExpandableSection>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}

