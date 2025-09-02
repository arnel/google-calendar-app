import React from "react";
import { DateRange } from "../types";

interface DateRangeSelectorProps {
  currentRange: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ currentRange, onChange }) => {
  const ranges: { value: DateRange; label: string }[] = [
    { value: 1, label: "Today" },
    { value: 7, label: "7 Days" },
    { value: 30, label: "30 Days" },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentRange === range.value
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector;
