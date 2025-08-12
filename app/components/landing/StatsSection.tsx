import { motion } from "framer-motion";

interface Stat {
  number: string;
  label: string;
}

interface StatsSectionProps {
  stats: Stat[];
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.8 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
    >
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-3xl font-bold text-emerald-600">
            {stat.number}
          </div>
          <div className="text-slate-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </motion.div>
  );
}
