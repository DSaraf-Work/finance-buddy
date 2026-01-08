import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface TransactionFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  paymentMode: 'all' | 'credit' | 'debit';
}

interface TransactionFilterModalProps {
  filters: TransactionFilters;
  onApplyFilters: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  totalCount?: number;
}

export function TransactionFilterModal({
  filters,
  onApplyFilters,
  onClearFilters,
  totalCount = 0,
}: TransactionFilterModalProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);

  // Reset local filters when modal opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: TransactionFilters = {
      dateFrom: undefined,
      dateTo: undefined,
      paymentMode: 'all',
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.paymentMode !== 'all';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3",
            hasActiveFilters && "border-primary text-primary"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              Active
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Filter Transactions</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set filters to narrow down your transaction list
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range Section */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Date Range</Label>

            {/* From Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-from" className="text-sm text-muted-foreground">
                From
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-from"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-muted border-border text-foreground",
                      !localFilters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateFrom ? (
                      format(localFilters.dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateFrom}
                    onSelect={(date) =>
                      setLocalFilters({ ...localFilters, dateFrom: date })
                    }
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    disabled={(date) =>
                      date > new Date() || (localFilters.dateTo ? date > localFilters.dateTo : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-to" className="text-sm text-muted-foreground">
                To
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-to"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-muted border-border text-foreground",
                      !localFilters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateTo ? (
                      format(localFilters.dateTo, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateTo}
                    onSelect={(date) =>
                      setLocalFilters({ ...localFilters, dateTo: date })
                    }
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    disabled={(date) =>
                      date > new Date() || (localFilters.dateFrom ? date < localFilters.dateFrom : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Payment Mode Section */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Payment Mode</Label>
            <RadioGroup
              value={localFilters.paymentMode}
              onValueChange={(value: 'all' | 'credit' | 'debit') =>
                setLocalFilters({ ...localFilters, paymentMode: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-border" />
                <Label
                  htmlFor="all"
                  className="text-sm text-foreground cursor-pointer font-normal"
                >
                  Both (Credit & Debit)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" className="border-border" />
                <Label
                  htmlFor="credit"
                  className="text-sm text-foreground cursor-pointer font-normal"
                >
                  Credit Only (Income)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="debit" className="border-border" />
                <Label
                  htmlFor="debit"
                  className="text-sm text-foreground cursor-pointer font-normal"
                >
                  Debit Only (Expense)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}