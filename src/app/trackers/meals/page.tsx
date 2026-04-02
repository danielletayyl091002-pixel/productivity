"use client";

import { useState, useMemo } from "react";
import { useMeals } from "@/contexts/MealContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { UtensilsCrossed, Plus, Trash2, X } from "lucide-react";
import { toDateString, formatDisplayDate } from "@/lib/dates";
import { MealType, MealItem } from "@/types/meal";
import { generateId } from "@/lib/id";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" }, { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" }, { value: "snack", label: "Snack" },
];

const MEAL_EMOJI: Record<MealType, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

export default function MealsPage() {
  const { meals, nutritionGoals, addMeal, removeMeal } = useMeals();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(toDateString(new Date()));
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [items, setItems] = useState<MealItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemCal, setItemCal] = useState("");
  const [itemProtein, setItemProtein] = useState("");
  const [itemCarbs, setItemCarbs] = useState("");
  const [itemFat, setItemFat] = useState("");

  const addItem = () => {
    if (!itemName.trim()) return;
    setItems((prev) => [...prev, {
      id: generateId(), name: itemName.trim(),
      calories: itemCal ? parseInt(itemCal) : undefined,
      protein: itemProtein ? parseInt(itemProtein) : undefined,
      carbs: itemCarbs ? parseInt(itemCarbs) : undefined,
      fat: itemFat ? parseInt(itemFat) : undefined,
    }]);
    setItemName(""); setItemCal(""); setItemProtein(""); setItemCarbs(""); setItemFat("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    addMeal({ date, type: mealType, items });
    setItems([]); setShowForm(false);
  };

  const today = toDateString(new Date());
  const todayMeals = meals.filter((m) => m.date === today);
  const todayNutrition = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todayMeals.forEach((meal) => meal.items.forEach((item) => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    }));
    return totals;
  }, [todayMeals]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Meal Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Log Meal</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <p className="text-xs text-gray-500">Calories</p>
          <p className="text-lg font-bold text-gray-900">{todayNutrition.calories}</p>
          <ProgressBar value={todayNutrition.calories} max={nutritionGoals.dailyCalories} color="bg-amber-500" />
        </Card>
        <Card className="text-center py-3">
          <p className="text-xs text-gray-500">Protein</p>
          <p className="text-lg font-bold text-gray-900">{todayNutrition.protein}g</p>
          <ProgressBar value={todayNutrition.protein} max={nutritionGoals.dailyProtein} color="bg-red-500" />
        </Card>
        <Card className="text-center py-3">
          <p className="text-xs text-gray-500">Carbs</p>
          <p className="text-lg font-bold text-gray-900">{todayNutrition.carbs}g</p>
          <ProgressBar value={todayNutrition.carbs} max={nutritionGoals.dailyCarbs} color="bg-blue-500" />
        </Card>
        <Card className="text-center py-3">
          <p className="text-xs text-gray-500">Fat</p>
          <p className="text-lg font-bold text-gray-900">{todayNutrition.fat}g</p>
          <ProgressBar value={todayNutrition.fat} max={nutritionGoals.dailyFat} color="bg-yellow-500" />
        </Card>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input id="meal-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select id="meal-type" label="Meal Type" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} options={MEAL_TYPES} />
            </div>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">Food Items</p>
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5 text-sm">
                  <span>{item.name} {item.calories && `(${item.calories} cal)`}</span>
                  <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2">
                <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Food" className="col-span-2" />
                <Input id="item-cal" value={itemCal} onChange={(e) => setItemCal(e.target.value)} placeholder="Cal" type="number" />
                <Input id="item-protein" value={itemProtein} onChange={(e) => setItemProtein(e.target.value)} placeholder="Prot" type="number" />
                <Input id="item-carbs" value={itemCarbs} onChange={(e) => setItemCarbs(e.target.value)} placeholder="Carb" type="number" />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Add Item</Button>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save Meal</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {meals.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="h-10 w-10" />} title="No meals logged" description="Start tracking your nutrition" action={{ label: "Log Meal", onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {meals.slice(0, 30).map((meal) => {
            const cals = meal.items.reduce((s, i) => s + (i.calories || 0), 0);
            return (
              <Card key={meal.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MEAL_EMOJI[meal.type]}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 capitalize">{meal.type}</p>
                      {cals > 0 && <Badge>{cals} cal</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{formatDisplayDate(new Date(meal.date + "T00:00:00"))} &middot; {meal.items.length} items</p>
                  </div>
                </div>
                <button onClick={() => removeMeal(meal.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
