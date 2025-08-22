import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
  };
  featured?: boolean;
  onSelect: (planName: string) => void;
  disabled?: boolean;
  isCurrentPlan?: boolean;
  loading?: boolean;
}

export default function PlanCard({ plan, featured = false, onSelect, disabled = false, isCurrentPlan = false, loading = false }: PlanCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl transition-all duration-300 group relative",
      featured && "bg-gradient-to-br from-brand-50 to-indigo-50 border-2 border-brand-200 transform scale-105",
      isCurrentPlan && "border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50"
    )}>
      {featured && !isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            Current Plan
          </span>
        </div>
      )}
      
      <div className={cn("text-center mb-6", featured && "mt-4")}>
        <h3 className="text-xl font-bold text-slate-900 mb-2" data-testid={`text-plan-${plan.name.toLowerCase()}`}>
          {plan.name}
        </h3>
        <div className="text-3xl font-bold text-brand-600 mb-1" data-testid={`text-price-${plan.name.toLowerCase()}`}>
          R{plan.price}
        </div>
        <div className="text-sm text-slate-500">per month</div>
      </div>
      
      <ul className="space-y-3 mb-8 text-sm">
        {(Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')).map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-600">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        className={cn(
          "w-full py-3 rounded-xl font-semibold transition-all duration-200",
          isCurrentPlan
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : featured 
              ? "btn-primary" 
              : "btn-secondary"
        )}
        onClick={() => onSelect(plan.name)}
        disabled={disabled || isCurrentPlan}
        data-testid={`button-select-${plan.name.toLowerCase()}`}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...</>
        ) : isCurrentPlan ? (
          "Current Plan"
        ) : (
          "Choose Plan"
        )}
      </Button>
    </div>
  );
}
