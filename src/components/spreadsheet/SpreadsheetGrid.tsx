import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "calculated";
  width?: string;
  required?: boolean;
  min?: number;
  options?: { label: string; value: string }[];
  calculate?: (row: any) => number;
}

interface SpreadsheetGridProps {
  columns: ColumnDef[];
  data: any[];
  onChange: (data: any[]) => void;
  errors?: Record<number, Record<string, string>>;
}

export function SpreadsheetGrid({ columns, data, onChange, errors = {} }: SpreadsheetGridProps) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const cellRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addRow = () => {
    const newRow: any = {};
    columns.forEach((col) => {
      if (col.type === "number") newRow[col.key] = 0;
      else if (col.type === "calculated") newRow[col.key] = 0;
      else newRow[col.key] = "";
    });
    onChange([...data, newRow]);
  };

  const deleteRow = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const duplicateRow = (index: number) => {
    const rowToDuplicate = { ...data[index] };
    onChange([...data.slice(0, index + 1), rowToDuplicate, ...data.slice(index + 1)]);
  };

  const updateCell = (rowIndex: number, colKey: string, value: any) => {
    const newData = [...data];
    const column = columns.find(col => col.key === colKey);
    
    // Parse number types properly
    let parsedValue = value;
    if (column?.type === "number") {
      parsedValue = value === "" ? 0 : parseFloat(value) || 0;
    }
    
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: parsedValue };
    
    // Recalculate calculated fields
    columns.forEach((col) => {
      if (col.type === "calculated" && col.calculate) {
        newData[rowIndex][col.key] = col.calculate(newData[rowIndex]);
      }
    });
    
    onChange(newData);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const isEditable = columns[colIndex].type !== "calculated";
    
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < data.length - 1) {
        const key = `${rowIndex + 1}-${colIndex}`;
        cellRefs.current[key]?.focus();
        setFocusedCell({ row: rowIndex + 1, col: colIndex });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        const key = `${rowIndex - 1}-${colIndex}`;
        cellRefs.current[key]?.focus();
        setFocusedCell({ row: rowIndex - 1, col: colIndex });
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (colIndex < columns.length - 1) {
        const key = `${rowIndex}-${colIndex + 1}`;
        cellRefs.current[key]?.focus();
        setFocusedCell({ row: rowIndex, col: colIndex + 1 });
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (colIndex > 0) {
        const key = `${rowIndex}-${colIndex - 1}`;
        cellRefs.current[key]?.focus();
        setFocusedCell({ row: rowIndex, col: colIndex - 1 });
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const rows = pastedText.split("\n").filter(row => row.trim());
    
    const newData = [...data];
    
    rows.forEach((row, rIdx) => {
      const cells = row.split("\t");
      const targetRowIndex = rowIndex + rIdx;
      
      if (targetRowIndex >= newData.length) {
        const newRow: any = {};
        columns.forEach((col) => {
          if (col.type === "number") newRow[col.key] = 0;
          else if (col.type === "calculated") newRow[col.key] = 0;
          else newRow[col.key] = "";
        });
        newData.push(newRow);
      }
      
      cells.forEach((cell, cIdx) => {
        const targetColIndex = colIndex + cIdx;
        if (targetColIndex < columns.length) {
          const col = columns[targetColIndex];
          if (col.type !== "calculated") {
            const value = col.type === "number" ? parseFloat(cell) || 0 : cell;
            newData[targetRowIndex][col.key] = value;
          }
        }
      });
      
      // Recalculate calculated fields
      columns.forEach((col) => {
        if (col.type === "calculated" && col.calculate) {
          newData[targetRowIndex][col.key] = col.calculate(newData[targetRowIndex]);
        }
      });
    });
    
    onChange(newData);
  };

  const totals = columns.reduce((acc, col) => {
    if (col.type === "number" || col.type === "calculated") {
      acc[col.key] = data.reduce((sum, row) => sum + (parseFloat(row[col.key]) || 0), 0);
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>

      <div className="border border-grid-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid bg-grid-header border-b border-grid-border sticky top-0 z-10">
          <div className="flex">
            <div className="w-12 p-3 border-r border-grid-border"></div>
            {columns.map((col) => (
              <div
                key={col.key}
                className={cn("p-3 border-r border-grid-border font-medium text-sm", col.width || "flex-1")}
              >
                {col.label}
                {col.required && <span className="text-destructive ml-1">*</span>}
              </div>
            ))}
            <div className="w-24 p-3 font-medium text-sm">Actions</div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card">
          {data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No data yet. Click "Add Row" to start.
            </div>
          ) : (
            data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  "grid border-b border-grid-border hover:bg-grid-hover transition-colors",
                  focusedCell?.row === rowIndex && "bg-grid-selected"
                )}
              >
                <div className="flex">
                  <div className="w-12 p-3 border-r border-grid-border text-center text-sm text-muted-foreground">
                    {rowIndex + 1}
                  </div>
                  {columns.map((col, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const hasError = errors[rowIndex]?.[col.key];
                    
                    return (
                      <div
                        key={col.key}
                        className={cn(
                          "p-2 border-r border-grid-border",
                          col.width || "flex-1",
                          hasError && "bg-destructive/10"
                        )}
                      >
                        {col.type === "select" ? (
                          <Select
                            value={row[col.key]}
                            onValueChange={(value) => updateCell(rowIndex, col.key, value)}
                          >
                            <SelectTrigger className="h-8 border-0 focus:ring-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {col.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : col.type === "calculated" ? (
                          <div className="h-8 flex items-center px-3 bg-muted/50 rounded text-sm font-medium">
                            {row[col.key]?.toFixed(2) || "0.00"}
                          </div>
                        ) : (
                          <Input
                            ref={(el) => (cellRefs.current[cellKey] = el)}
                            type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                            value={row[col.key]}
                            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                            onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                            className={cn(
                              "h-8 border-0 focus:ring-1 focus:ring-primary",
                              hasError && "border-destructive focus:ring-destructive"
                            )}
                            min={col.min}
                          />
                        )}
                        {hasError && (
                          <p className="text-xs text-destructive mt-1">{hasError}</p>
                        )}
                      </div>
                    );
                  })}
                  <div className="w-24 p-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateRow(rowIndex)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRow(rowIndex)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals */}
        {data.length > 0 && (
          <div className="grid bg-grid-header border-t border-grid-border sticky bottom-0">
            <div className="flex">
              <div className="w-12 p-3 border-r border-grid-border"></div>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={cn("p-3 border-r border-grid-border font-bold text-sm", col.width || "flex-1")}
                >
                  {(col.type === "number" || col.type === "calculated") && totals[col.key]?.toFixed(2)}
                </div>
              ))}
              <div className="w-24 p-3"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
