// src/components/date-filter.tsx
"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export type DateFilterValue =
  | { mode: "all" }
  | {
      mode: "month";
      monthYear: Date; // 1st of month
    }
  | {
      mode: "day";
      monthYear: Date; // keep for context
      day: Date;
    };

type DateFilterProps = {
  value?: DateFilterValue;
  onChange?: (value: DateFilterValue) => void;
  fromYear?: number;
  toYear?: number;
};

export function DateFilter({
  value,
  onChange,
  fromYear = 2023,
  toYear = 2032,
}: DateFilterProps) {
  // derive current month/year from value or today
  const today = new Date();
  const initialMonthYear =
    value && value.mode !== "all" ? value.monthYear : new Date(today.getFullYear(), today.getMonth(), 1);

  const [monthYear, setMonthYear] = React.useState<Date>(initialMonthYear);
  const [day, setDay] = React.useState<Date | null>(value?.mode === "day" ? value.day : null);

  const [openMY, setOpenMY] = React.useState(false);

  const currentMonth = monthYear.getMonth();
  const currentYear = monthYear.getFullYear();

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = fromYear; y <= toYear; y++) list.push(y);
    return list;
  }, [fromYear, toYear]);

  const emit = React.useCallback(
    (next: DateFilterValue) => {
      onChange?.(next);
    },
    [onChange]
  );

  // handler: All
  const handleAll = () => {
    setDay(null);
    emit({ mode: "all" });
  };

  // handler: month change
  const handleMonthChange = (m: number) => {
    const next = new Date(currentYear, m, 1);
    setMonthYear(next);
    setDay(null);
    emit({ mode: "month", monthYear: next });
  };

  const handleYearChange = (y: number) => {
    const next = new Date(y, currentMonth, 1);
    setMonthYear(next);
    setDay(null);
    emit({ mode: "month", monthYear: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ALL BUTTON */}
      <Button
        type="button"
        variant={value?.mode === "all" || !value ? "default" : "outline"}
        onClick={handleAll}
      >
        All
      </Button>

      {/* Month-Year Picker */}
      <Popover open={openMY} onOpenChange={setOpenMY}>
        <PopoverTrigger asChild>
          <Button
            variant={value?.mode === "month" || value?.mode === "day" ? "outline" : "secondary"}
            className="w-[210px] justify-between"
          >
            {MONTHS[currentMonth]} {currentYear}
            <CalendarIcon className="ml-2 h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[210px] space-y-2">
          <Select value={String(currentMonth)} onValueChange={(v) => handleMonthChange(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, idx) => (
                <SelectItem key={m} value={String(idx)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(currentYear)} onValueChange={(v) => handleYearChange(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>

      {/* Optional Day Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={value?.mode === "day" ? "outline" : "secondary"}
            className={cn(
              "w-[210px] justify-start text-left",
              value?.mode !== "day" && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.mode === "day"
              ? value.day.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Pick specific day"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Calendar
            mode="single"
            selected={day ?? undefined}
            month={monthYear}
            onSelect={(d) => {
              if (!d) {
                // user cleared date from calendar
                setDay(null);
                emit({ mode: "month", monthYear });
              } else {
                setDay(d);
                emit({ mode: "day", monthYear, day: d });
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
