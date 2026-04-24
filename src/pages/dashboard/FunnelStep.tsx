const FunnelStep = ({ label, count, color, width }: any) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-sm font-semibold text-slate-600 px-1">
      <span>{label}</span>
      <span className="text-gray-900">{count}</span>
    </div>
    <div className="h-7 w-full bg-gray-50 rounded-xl overflow-hidden p-0.5 border border-gray-200/50">
      <div
        className={`h-full ${color} transition-all duration-1000 rounded-[9px] shadow-sm`}
        style={{ width: width }}
      />
    </div>
  </div>
);
export default FunnelStep;
