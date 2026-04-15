const MetricCard = ({ title, value, description, type, highlight }: any) => {
  const styles: any = {
    danger: "bg-red-50 border-red-100 text-red-600",
    warning: "bg-orange-50 border-orange-100 text-orange-600",
    info: "bg-indigo-50 border-indigo-100 text-indigo-600",
    success: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };
  return (
    <div
      className={`${styles[type]} p-5 rounded-3xl border transition-all hover:shadow-md cursor-default`}
    >
      <h4 className="uppercase tracking-wider font-black opacity-60">
        {title}
      </h4>
      <p
        className={`text-3xl font-black my-1 ${highlight && type === "warning" ? "animate-pulse" : ""}`}
      >
        {value}
      </p>
      <p className="text-[11px] font-medium opacity-80">{description}</p>
    </div>
  );
};

export default MetricCard;
