export interface MealPrepIngredient {
  name: string;
  aliases?: string[];
}

export interface MealPrepRecipe {
  id: string;
  name: string;
  servings: number;
  prepMinutes: number;
  tags: string[];
  ingredients: MealPrepIngredient[];
  optional?: string[];
  steps: string[];
}

export const MEAL_PREP_RECIPES: MealPrepRecipe[] = [
  {
    id: "chicken-rice-bowls",
    name: "Chicken & rice meal prep bowls",
    servings: 5,
    prepMinutes: 45,
    tags: ["high-protein", "weekday-lunch"],
    ingredients: [
      { name: "chicken breast", aliases: ["chicken"] },
      { name: "rice", aliases: ["jasmine rice", "brown rice"] },
      { name: "broccoli", aliases: ["broccoli florets"] },
      { name: "soy sauce" },
    ],
    optional: ["sesame oil", "garlic"],
    steps: [
      "Season and bake chicken at 400°F for 22–25 min.",
      "Cook rice; steam broccoli.",
      "Slice chicken, divide into containers with rice and broccoli.",
      "Drizzle soy sauce before sealing.",
    ],
  },
  {
    id: "overnight-oats",
    name: "Overnight oats (5 jars)",
    servings: 5,
    prepMinutes: 15,
    tags: ["breakfast", "no-cook"],
    ingredients: [
      { name: "oats", aliases: ["rolled oats"] },
      { name: "milk", aliases: ["almond milk", "oat milk"] },
      { name: "greek yogurt", aliases: ["yogurt"] },
      { name: "berries", aliases: ["blueberries", "strawberries"] },
    ],
    optional: ["honey", "chia seeds"],
    steps: [
      "Combine oats, milk, and yogurt in jars.",
      "Top with berries.",
      "Refrigerate overnight; grab one each morning.",
    ],
  },
  {
    id: "egg-muffins",
    name: "Spinach & cheese egg muffins",
    servings: 12,
    prepMinutes: 30,
    tags: ["breakfast", "high-protein"],
    ingredients: [
      { name: "eggs" },
      { name: "spinach" },
      { name: "cheese", aliases: ["cheddar", "mozzarella"] },
    ],
    optional: ["bell pepper", "onion"],
    steps: [
      "Whisk eggs; fold in spinach and cheese.",
      "Pour into greased muffin tin.",
      "Bake at 350°F for 20–22 min.",
    ],
  },
  {
    id: "turkey-chili",
    name: "Turkey chili (big batch)",
    servings: 8,
    prepMinutes: 50,
    tags: ["dinner", "freezer-friendly"],
    ingredients: [
      { name: "ground turkey", aliases: ["turkey"] },
      { name: "black beans", aliases: ["beans"] },
      { name: "diced tomatoes", aliases: ["tomatoes", "crushed tomatoes"] },
      { name: "onion" },
    ],
    optional: ["chili powder", "cumin", "garlic"],
    steps: [
      "Brown turkey with onion.",
      "Add tomatoes and beans; simmer 30 min.",
      "Portion into containers; freezes well.",
    ],
  },
  {
    id: "pasta-salad",
    name: "Chicken pasta salad",
    servings: 6,
    prepMinutes: 25,
    tags: ["lunch", "cold"],
    ingredients: [
      { name: "pasta", aliases: ["penne", "rotini"] },
      { name: "chicken breast", aliases: ["chicken", "rotisserie chicken"] },
      { name: "bell pepper", aliases: ["peppers"] },
      { name: "italian dressing", aliases: ["dressing"] },
    ],
    optional: ["feta", "olives"],
    steps: [
      "Cook pasta; cool.",
      "Dice chicken and pepper; toss with dressing.",
      "Divide into containers.",
    ],
  },
  {
    id: "salmon-sheet-pan",
    name: "Sheet pan salmon & veggies",
    servings: 4,
    prepMinutes: 35,
    tags: ["dinner", "high-protein"],
    ingredients: [
      { name: "salmon", aliases: ["salmon fillet"] },
      { name: "asparagus", aliases: ["green beans", "broccoli"] },
      { name: "sweet potato", aliases: ["potatoes"] },
      { name: "lemon" },
    ],
    optional: ["olive oil", "garlic"],
    steps: [
      "Cube sweet potato; roast 15 min at 425°F.",
      "Add salmon and asparagus; roast 12–15 min more.",
      "Squeeze lemon over portions.",
    ],
  },
  {
    id: "beef-stir-fry",
    name: "Beef stir-fry boxes",
    servings: 4,
    prepMinutes: 30,
    tags: ["dinner", "high-protein"],
    ingredients: [
      { name: "beef", aliases: ["steak", "sirloin", "ground beef"] },
      { name: "rice", aliases: ["jasmine rice"] },
      { name: "bell pepper", aliases: ["peppers"] },
      { name: "soy sauce" },
    ],
    optional: ["ginger", "garlic", "broccoli"],
    steps: [
      "Cook rice.",
      "Stir-fry beef; add peppers.",
      "Sauce with soy; portion over rice.",
    ],
  },
  {
    id: "greek-chicken",
    name: "Greek chicken & quinoa bowls",
    servings: 5,
    prepMinutes: 40,
    tags: ["lunch", "mediterranean"],
    ingredients: [
      { name: "chicken breast", aliases: ["chicken"] },
      { name: "quinoa" },
      { name: "cucumber" },
      { name: "feta", aliases: ["feta cheese"] },
    ],
    optional: ["tomatoes", "olive oil", "lemon"],
    steps: [
      "Grill or bake seasoned chicken.",
      "Cook quinoa.",
      "Assemble bowls with cucumber and feta.",
    ],
  },
  {
    id: "lentil-soup",
    name: "Lentil & vegetable soup",
    servings: 8,
    prepMinutes: 45,
    tags: ["dinner", "vegetarian", "freezer-friendly"],
    ingredients: [
      { name: "lentils" },
      { name: "carrots", aliases: ["carrot"] },
      { name: "celery" },
      { name: "onion" },
    ],
    optional: ["vegetable broth", "garlic", "cumin"],
    steps: [
      "Sauté onion, carrots, and celery.",
      "Add lentils and broth; simmer until tender.",
      "Blend partially if desired; portion for the week.",
    ],
  },
  {
    id: "tuna-salad",
    name: "Tuna salad lettuce wraps",
    servings: 4,
    prepMinutes: 15,
    tags: ["lunch", "quick"],
    ingredients: [
      { name: "tuna", aliases: ["canned tuna"] },
      { name: "greek yogurt", aliases: ["mayonnaise", "yogurt"] },
      { name: "celery" },
      { name: "lettuce", aliases: ["romaine", "butter lettuce"] },
    ],
    optional: ["mustard", "lemon"],
    steps: [
      "Mix tuna, yogurt, and diced celery.",
      "Spoon into lettuce cups when ready to eat.",
      "Keep filling separate from lettuce until serving.",
    ],
  },
  {
    id: "burrito-bowls",
    name: "Burrito meal prep bowls",
    servings: 5,
    prepMinutes: 40,
    tags: ["lunch", "mexican"],
    ingredients: [
      { name: "chicken breast", aliases: ["chicken"] },
      { name: "rice", aliases: ["jasmine rice"] },
      { name: "black beans", aliases: ["beans"] },
      { name: "salsa" },
    ],
    optional: ["cheese", "lime", "avocado"],
    steps: [
      "Season and cook chicken; slice.",
      "Layer rice, beans, chicken, and salsa in containers.",
      "Add cheese and lime when reheating.",
    ],
  },
  {
    id: "cottage-cheese-bowls",
    name: "Protein cottage cheese bowls",
    servings: 4,
    prepMinutes: 10,
    tags: ["breakfast", "quick", "high-protein"],
    ingredients: [
      { name: "cottage cheese" },
      { name: "berries", aliases: ["blueberries", "strawberries"] },
      { name: "almonds", aliases: ["nuts", "walnuts"] },
      { name: "honey" },
    ],
    optional: ["granola"],
    steps: [
      "Portion cottage cheese into containers.",
      "Pack berries and nuts separately.",
      "Drizzle honey before eating.",
    ],
  },
];

/** Always assumed on hand for recipe matching */
export const PANTRY_STAPLES = [
  "salt",
  "pepper",
  "olive oil",
  "oil",
  "water",
  "garlic",
  "garlic powder",
  "butter",
  "vegetable broth",
  "chicken broth",
];

export function normalizeIngredient(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/\b(a|an|the)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.endsWith("ies") && s.length > 4) s = `${s.slice(0, -3)}y`;
  else if (s.endsWith("es") && s.length > 4) s = s.slice(0, -2);
  else if (s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

function ingredientMatches(pantryNorm: string[], ingredient: MealPrepIngredient): boolean {
  const names = [ingredient.name, ...(ingredient.aliases ?? [])].map(normalizeIngredient);
  return names.some((n) => pantryNorm.some((p) => p.includes(n) || n.includes(p)));
}

export interface RecipeMatch {
  recipe: MealPrepRecipe;
  have: string[];
  missing: string[];
  score: number;
  ready: boolean;
}

export function matchRecipes(pantryItems: string[]): RecipeMatch[] {
  const pantryNorm = [
    ...PANTRY_STAPLES.map(normalizeIngredient),
    ...pantryItems.map(normalizeIngredient),
  ];

  return MEAL_PREP_RECIPES.map((recipe) => {
    const have: string[] = [];
    const missing: string[] = [];

    for (const ing of recipe.ingredients) {
      if (ingredientMatches(pantryNorm, ing)) {
        have.push(ing.name);
      } else {
        missing.push(ing.name);
      }
    }

    const score = recipe.ingredients.length
      ? have.length / recipe.ingredients.length
      : 0;

    return {
      recipe,
      have,
      missing,
      score,
      ready: missing.length === 0,
    };
  })
    .sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return b.score - a.score;
    });
}

export function suggestShoppingForRecipe(match: RecipeMatch): string[] {
  return match.missing;
}
