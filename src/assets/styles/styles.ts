export const selectArrow = `
  appearance-none 
  bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22gray%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] 
  bg-[length:1rem] 
  bg-[right_0.75rem_center] 
  bg-no-repeat 
  pr-10
  px-3 py-2 text-sm border border-gray-200 outline-none 
`
  .replace(/\s+/g, " ")
  .trim();

export const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

export const labelClass = "text-sm font-bold text-gray-700 mb-1 ";

export const errorClass = "text-red-500 text-[11px] mt-1 font-medium";
