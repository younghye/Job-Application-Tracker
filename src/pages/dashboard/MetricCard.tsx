const MetricCard = ({ title, value, description, type }: any) => {
  const styles: any = {
    rejectionRate: "bg-red-50 border-red-100 text-red-600",
    ghosted: "bg-orange-50 border-orange-100 text-orange-600",
    resumeStrength: "bg-indigo-50 border-indigo-100 text-indigo-600",
    total: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };
  return (
    <div
      className={`${styles[type]} p-5 rounded-3xl border transition-all hover:shadow-md cursor-default flex flex-col justify-center h-full`}
    >
      <h4 className="text-sm uppercase tracking-wider font-black opacity-60">
        {title}
      </h4>
      <p className={`text-2xl lg:text-3xl font-black my-1 `}>{value}</p>
      <p className="text-sm font-medium opacity-80">{description}</p>
    </div>
  );
};

export default MetricCard;
