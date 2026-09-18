export const CONDITION_RULES: Record<string, string> = {
  "diabetes": "Flag and adjust any recommendation involving high sugar or high-glycemic foods (e.g., white bread, sugary drinks, white rice in large amounts). Suggest lower-glycemic alternatives.",
  "hypertension": "Flag and adjust any recommendation involving high sodium foods (e.g., processed foods, canned soups, salty snacks). Suggest lower-sodium alternatives.",
  "high cholesterol": "Flag and adjust any recommendation involving high saturated fat foods (e.g., fried foods, fatty red meat). Suggest leaner alternatives.",
  "asthma": "Flag any recommendation involving intense outdoor exercise during poor air quality conditions.",
  "peanuts": "Flag any food recommendation or meal analysis that includes peanuts or peanut-derived ingredients as a serious allergy warning.",
  "shellfish": "Flag any food recommendation or meal analysis that includes shellfish as a serious allergy warning.",
  "dairy": "Flag any food recommendation or meal analysis that includes dairy products.",
  "gluten": "Flag any food recommendation or meal analysis that includes wheat, barley, or gluten-containing ingredients."
};
