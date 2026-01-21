import React from 'react';
import type { StudentYear } from '../types';

interface StudentYearSelectProps {
  value: StudentYear[];                // [] means All Years
  onChange: (value: StudentYear[]) => void;
  id?: string;
  includeAll?: boolean;
}

export const studentYears: StudentYear[] = [
  'Incoming/Prospective',
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
];

const StudentYearSelect: React.FC<StudentYearSelectProps> = ({
  value,
  onChange,
  id,
  includeAll = true,
}) => {
  const isAll = value.length === 0;

  const toggleYear = (year: StudentYear) => {
    if (value.includes(year)) {
      onChange(value.filter((y) => y !== year));
    } else {
      onChange([...value, year]);
    }
  };

  return (
    <div id={id} className="space-y-2">
      {includeAll && (
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={isAll}
            onChange={(e) => onChange(e.target.checked ? [] : value)}
            className="accent-red-700"
          />
          All Years
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        {studentYears.map((year) => (
          <label key={year} className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={value.includes(year)}
              onChange={() => toggleYear(year)}
              className="accent-red-700"
            />
            {year}
          </label>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        {isAll ? 'Showing posts for all years.' : `Selected: ${value.join(', ')}`}
      </div>
    </div>
  );
};

export default StudentYearSelect;
