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
            hasActiveFilters && "border-[#8C50FF] text-[#8C50FF]"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-[#8C50FF] text-white rounded-full">
              Active
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#09090B] border-[#27272A]">
        <DialogHeader>
          <DialogTitle className="text-[#FAFAFA]">Filter Transactions</DialogTitle>
          <DialogDescription className="text-[#A1A1AA]">
            Set filters to narrow down your transaction list
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range Section */}
          <div className="space-y-3">
            <Label className="text-[#FAFAFA] font-medium">Date Range</Label>

            {/* From Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-from" className="text-sm text-[#A1A1AA]">
                From
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-from"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-[#18181B] border-[#27272A] text-[#FAFAFA]",
                      !localFilters.dateFrom && "text-[#71717A]"
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
                <PopoverContent className="w-auto p-0 bg-[#09090B] border-[#27272A]" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateFrom}
                    onSelect={(date) =>
                      setLocalFilters({ ...localFilters, dateFrom: date })
                    }
                    initialFocus
                    disabled={(date) =>
                      date > new Date() || (localFilters.dateTo ? date > localFilters.dateTo : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-to" className="text-sm text-[#A1A1AA]">
                To
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-to"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-[#18181B] border-[#27272A] text-[#FAFAFA]",
                      !localFilters.dateTo && "text-[#71717A]"
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
                <PopoverContent className="w-auto p-0 bg-[#09090B] border-[#27272A]" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateTo}
                    onSelect={(date) =>
                      setLocalFilters({ ...localFilters, dateTo: date })
                    }
                    initialFocus
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
            <Label className="text-[#FAFAFA] font-medium">Payment Mode</Label>
            <RadioGroup
              value={localFilters.paymentMode}
              onValueChange={(value: 'all' | 'credit' | 'debit') =>
                setLocalFilters({ ...localFilters, paymentMode: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-[#27272A]" />
                <Label
                  htmlFor="all"
                  className="text-sm text-[#FAFAFA] cursor-pointer font-normal"
                >
                  Both (Credit & Debit)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" className="border-[#27272A]" />
                <Label
                  htmlFor="credit"
                  className="text-sm text-[#FAFAFA] cursor-pointer font-normal"
                >
                  Credit Only (Income)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="debit" className="border-[#27272A]" />
                <Label
                  htmlFor="debit"
                  className="text-sm text-[#FAFAFA] cursor-pointer font-normal"
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
            className="text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-[#8C50FF] hover:bg-[#7C3AED] text-white"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}