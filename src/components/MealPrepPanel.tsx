import { useMemo, useState } from "react";
import { Check, ChefHat, ShoppingCart, Sparkles } from "lucide-react";
import type { ShoppingItem, UserSettings } from "../types";
import { buildMealPrepPlan, isMealPrepDay, mealPrepHeadline } from "../lib/mealPrep";
import type { RecipeMatch } from "../lib/mealPrepRecipes";

interface Props {
  settings: UserSettings;
  items: ShoppingItem[];
  onAdd: (name: string, inPantry?: boolean) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function MealPrepPanel({ settings, items, onAdd, onToggle, onRemove }: Props) {
  const [text, setText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const plan = useMemo(() => buildMealPrepPlan(items), [items]);
  const sunday = isMealPrepDay(settings);
  const headline = mealPrepHeadline(settings, plan);

  const topRecipes = plan.recipes.filter((r) => r.ready || r.score >= 0.5).slice(0, 4);

  return (
    <section
      className={`panel p-5 ${sunday ? "border-alfred-gold/40 bg-alfred-gold/5" : "border-alfred-border/80"}`}
    >
      <h3 className="font-display text-lg text-alfred-gold mb-1 flex items-center gap-2">
        {sunday ? <Sparkles className="h-4 w-4" /> : <ChefHat className="h-4 w-4" />}
        {headline}
      </h3>
      {sunday && (
        <p className="text-xs text-alfred-mist mb-3">
          Check off groceries as you shop — Alfred updates meal prep recipes from what&apos;s in your pantry.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-alfred-mist mb-2 flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Shopping list
          </p>
          <form
            className="flex gap-2 mb-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onAdd(text, false);
              setText("");
            }}
          >
            <input
              className="input-field flex-1 text-sm"
              placeholder="Add eggs, chicken, rice…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn-gold px-3" aria-label="Add item">
              <Check className="h-4 w-4" />
            </button>
          </form>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {plan.toBuy.length === 0 && plan.pantry.length === 0 && (
              <li className="text-sm text-alfred-mist">List is empty — add ingredients above.</li>
            )}
            {plan.toBuy.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </ul>
          {plan.pantry.length > 0 && (
            <div className="mt-3 border-t border-alfred-border/60 pt-2">
              <p className="text-xs text-alfred-mist mb-1.5">In pantry ({plan.pantry.length})</p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {items
                  .filter((i) => i.inPantry)
                  .map((item) => (
                    <ShoppingRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-alfred-mist mb-2 flex items-center gap-1">
            <ChefHat className="h-3.5 w-3.5" /> Meal prep recipes
          </p>
          {topRecipes.length === 0 && (
            <p className="text-sm text-alfred-mist">
              Add or check off ingredients to see what you can make.
            </p>
          )}
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {topRecipes.map((match) => (
              <RecipeCard
                key={match.recipe.id}
                match={match}
                expanded={expandedId === match.recipe.id}
                onToggle={() =>
                  setExpandedId((id) => (id === match.recipe.id ? null : match.recipe.id))
                }
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-2 text-sm group">
      <button
        type="button"
        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
          item.inPantry ? "bg-alfred-gold border-alfred-gold" : "border-alfred-border hover:border-alfred-gold"
        }`}
        onClick={() => onToggle(item.id)}
        aria-label={item.inPantry ? "Move back to shopping list" : "Mark as in pantry"}
      >
        {item.inPantry && <Check className="h-3 w-3 text-alfred-ink" />}
      </button>
      <span className={`flex-1 truncate ${item.inPantry ? "text-alfred-mist line-through" : ""}`}>
        {item.name}
      </span>
      <button
        type="button"
        className="text-xs text-alfred-mist/50 opacity-0 group-hover:opacity-100 hover:text-red-300"
        onClick={() => onRemove(item.id)}
      >
        ×
      </button>
    </li>
  );
}

function RecipeCard({
  match,
  expanded,
  onToggle,
}: {
  match: RecipeMatch;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { recipe, ready, missing, have } = match;
  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm ${
        ready ? "border-emerald-500/40 bg-emerald-500/5" : "border-alfred-border/60"
      }`}
    >
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium">{recipe.name}</span>
          <span className="text-xs text-alfred-mist shrink-0">{recipe.prepMinutes}m</span>
        </div>
        <p className="text-xs text-alfred-mist mt-0.5">
          {ready ? (
            <span className="text-emerald-400/90">Ready to prep · {recipe.servings} servings</span>
          ) : (
            <>Need: {missing.join(", ")}</>
          )}
        </p>
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-alfred-border/40 text-xs text-alfred-mist space-y-2">
          <p>
            <span className="text-alfred-gold">Have:</span> {have.join(", ") || "—"}
          </p>
          {!ready && missing.length > 0 && (
            <p>
              <span className="text-alfred-gold">Pick up:</span> {missing.join(", ")}
            </p>
          )}
          <ol className="list-decimal list-inside space-y-1">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}
