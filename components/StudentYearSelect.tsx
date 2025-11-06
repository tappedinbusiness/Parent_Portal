import React from 'react';
import type { StudentYear } from '../types';

interface StudentYearSelectProps {
  value: StudentYear | 'All';
  onChange: (value: StudentYear | 'All') => void;
  id?: string;
  includeAll?: boolean;
}

export const studentYears: StudentYear[] = ['Incoming/Prospective', 'Freshman', 'Sophomore', 'Junior', 'Senior'];

const StudentYearSelect: React.FC<StudentYearSelectProps> = ({ value, onChange, id, includeAll = false }) => {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as StudentYear | 'All')}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700 transition duration-200 bg-white text-gray-900"
    >
      {includeAll && <option value="All">All Years</option>}
      {studentYears.map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  );
};

export default StudentYearSelect;