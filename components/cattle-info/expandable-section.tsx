"use client";

import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableSection({
  title,
  children,
  defaultExpanded = true,
  className,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-semibold"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

