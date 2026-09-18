import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Utensils,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  RotateCcw,
  Flame,
  PieChart,
  ArrowRight,
  HelpCircle,
  X,
  Plus,
} from 'lucide-react';
import { UserHealthProfile, MealScanResult, ScanConfidence } from '../types';
import { useRateLimit } from '../context/RateLimitContext';

// Preset sample meals for instant 1-click testing
const SAMPLE_MEALS = [
  {
    title: 'Grilled Salmon Bowl',
    subtitle: 'Salmon, Quinoa, Avocado',
    description: 'Grilled salmon fillet served with steamed quinoa, sliced avocado, and steamed broccoli.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Avocado Toast with Egg',
    subtitle: 'Whole wheat, Poached Egg',
    description: 'Toasted whole wheat bread topped with mashed avocado, poached egg, and chili flakes.',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Berry Oatmeal & Nuts',
    subtitle: 'Rolled Oats, Fresh Berries',
    description: 'Warm rolled oats topped with fresh blueberries, sliced strawberries, and crushed walnuts.',
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80',
  },
];

interface MealScannerProps {
  userProfile?: UserHealthProfile;
}

export const MealScanner: React.FC<MealScannerProps> = ({ userProfile }) => {
  const { attemptRequest, isCoolingDown, rateLimitWait } = useRateLimit();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<MealScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User clarification input for handling Subfeature 3 (confidence/uncertainty)
  const [userClarification, setUserClarification] = useState<string>('');
  const [isClarifying, setIsClarifying] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setSelectedFileName(file.name);
      setScanResult(null);
      setError(null);
      setUserClarification('');
    };
    reader.onerror = () => {
      setError('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setSelectedFileName(file.name);
      setScanResult(null);
      setError(null);
      setUserClarification('');
    };
    reader.readAsDataURL(file);
  };

  // Convert sample image URL to Base64 using an off-screen canvas to guarantee clean base64 data
  const handleSelectSample = async (sample: (typeof SAMPLE_MEALS)[0]) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setSelectedFileName(sample.title);

      // Create an image object and draw to canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sample.imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 800);
      canvas.height = Math.min(img.height, 800 * (img.height / img.width));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(base64);

      // Trigger automatic scan on sample selection
      await executeScan(base64, 'image/jpeg');
    } catch (err: any) {
      console.warn('Sample load error, falling back to direct scan prompt:', err);
      // Fallback with visual placeholder image
      setError('Unable to load sample remote image. Please upload an image directly.');
      setIsAnalyzing(false);
    }
  };

  // Core scan execution method
  const executeScan = async (base64Img: string, mime = 'image/jpeg', clarification?: string) => {
    const req = attemptRequest();
    if (!req.allowed) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/scan-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Img,
          mimeType: mime,
          userClarification: clarification,
          userProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result: MealScanResult = await response.json();
      setScanResult(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to analyze meal image. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setIsClarifying(false);
    }
  };

  const handleStartScan = () => {
    if (!selectedImage) return;
    executeScan(selectedImage);
  };

  const handleApplyClarification = () => {
    if (!selectedImage || !userClarification.trim()) return;
    setIsClarifying(true);
    executeScan(selectedImage, 'image/jpeg', userClarification);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFileName('');
    setScanResult(null);
    setError(null);
    setUserClarification('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confidence badge styling helper
  const getConfidenceBadge = (confidence: ScanConfidence) => {
    switch (confidence) {
      case 'high':
        return {
          label: 'High Confidence',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          desc: 'Items clearly visible, well-lit, and unambiguous.',
        };
      case 'medium':
        return {
          label: 'Medium Confidence',
          color: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" />,
          desc: 'General dish recognized; exact portions or hidden oils estimated.',
        };
      case 'low':
      default:
        return {
          label: 'Low Confidence',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          desc: 'Items obscured, mixed, or lighting unclear.',
        };
    }
  };

  // Calculate macro percentage distribution
  const totalMacroGrams =
    scanResult ? scanResult.protein_g + scanResult.carbs_g + scanResult.fat_g : 0;
  const proteinPct =
    totalMacroGrams > 0 ? Math.round((scanResult!.protein_g / totalMacroGrams) * 100) : 0;
  const carbsPct =
    totalMacroGrams > 0 ? Math.round((scanResult!.carbs_g / totalMacroGrams) * 100) : 0;
  const fatPct =
    totalMacroGrams > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  return (
    <section id="meal-scanner-section" className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-cream-soft">AI Meal Scanner</h3>
          <p className="text-xs text-beige-light/80">
            Multimodal food recognition, portion analysis, and estimated macro breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedImage && (
            <button
              onClick={handleReset}
              className="text-xs font-medium text-cream-soft px-3 py-1 rounded-full bg-olive-canvas/80 border border-olive-light/40 hover:bg-olive transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Upload new meal"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <span className="text-xs font-medium text-cream-soft px-2.5 py-1 rounded-full bg-olive-canvas/80 border border-olive-light/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-olive-light" />
            <span>Vision Engine Ready</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload & Preview Area (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-wellness-dark flex items-center gap-2">
                <Camera className="w-4 h-4 text-olive" />
                <span>Upload or Capture Meal</span>
              </div>
              <span className="text-[10px] font-semibold text-wellness-muted uppercase tracking-wider px-2 py-0.5 rounded bg-beige-cream">
                Input Handling
              </span>
            </div>

            <p className="text-xs text-wellness-muted mb-4">
              Submit a photo of your meal. The vision model analyzes visible items, portion sizes, preparation methods, and dressings.
            </p>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Box / Image Preview */}
            {!selectedImage ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { if (isCoolingDown || rateLimitWait > 0) return; handleDrop(e); }}
                onClick={() => { if (isCoolingDown || rateLimitWait > 0) return; fileInputRef.current?.click(); }}
                className={`border-2 border-dashed border-wellness-border hover:border-olive rounded-2xl p-6 sm:p-8 bg-beige-cream/30 hover:bg-beige-cream/60 transition-all flex flex-col items-center justify-center text-center group ${isCoolingDown || rateLimitWait > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-cream-soft border border-wellness-border flex items-center justify-center text-olive mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <UploadCloud className="w-7 h-7 stroke-1 text-olive" />
                </div>

                <span className="text-sm font-semibold text-wellness-dark">
                  Choose or Drop Meal Photo
                </span>
                <span className="text-xs text-wellness-muted mt-1 max-w-xs">
                  Supports JPEG, PNG, or WebP. Full plate context enables better portion estimates.
                </span>

                <button
                  type="button"
                  disabled={isCoolingDown || rateLimitWait > 0}
                  className="mt-4 px-4 py-2 rounded-xl bg-olive hover:bg-olive-light text-cream-soft font-medium text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Browse Photo</span>
                </button>
              </div>
            ) : (
              /* Selected Image Preview */
              <div className="relative rounded-2xl overflow-hidden border border-wellness-border bg-black/5">
                <img
                  src={selectedImage}
                  alt="Selected meal"
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-3 bg-cream-soft/95 border-t border-wellness-border/70 flex items-center justify-between text-xs">
                  <div className="truncate font-medium text-wellness-dark max-w-[200px]">
                    {selectedFileName || 'Captured Meal'}
                  </div>
                  <button
                    onClick={handleStartScan}
                    disabled={isAnalyzing || isCoolingDown || rateLimitWait > 0}
                    className="px-3.5 py-1.5 rounded-xl bg-olive hover:bg-olive-light disabled:opacity-50 text-cream-soft font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{scanResult ? 'Re-scan Meal' : 'Scan Meal'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Rate Limit Spam Banner */}
            {rateLimitWait > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs flex items-center gap-2 shadow-2xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" />
                <span className="font-medium">You're sending requests too quickly. Please wait a moment before trying again. ({rateLimitWait}s)</span>
              </div>
            )}

            {/* Error Message Banner */}
            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Preset Samples */}
            <div className="mt-5">
              <div className="text-[11px] font-semibold text-wellness-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Or Try A Sample Meal:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_MEALS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    disabled={isAnalyzing || isCoolingDown || rateLimitWait > 0}
                    className="p-2.5 rounded-xl bg-beige-cream/40 hover:bg-beige-cream/80 border border-wellness-border/80 text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-wellness-dark truncate group-hover:text-olive">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-wellness-muted truncate mt-0.5">
                      {sample.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subfeature 4 Disclaimer in upload card */}
          <div className="mt-4 pt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted leading-relaxed flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-olive shrink-0 mt-0.5" />
            <span>
              <strong>Portion Estimation Caveat:</strong> Visual macro and calorie estimates are approximate (±20%). Hidden fats, cooking oils, and sodium cannot be directly determined from a photo alone.
            </span>
          </div>
        </div>

        {/* Right: Nutritional Breakdown & Structured Results Area (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-wellness-border/60">
              <div className="text-sm font-semibold text-wellness-dark flex items-center gap-2">
                <Utensils className="w-4 h-4 text-olive" />
                <span>Nutrient Breakdown & Food Items</span>
              </div>
              {scanResult && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Analyzed
                </span>
              )}
            </div>

            {/* Empty State when no meal has been analyzed */}
            {!scanResult && !isAnalyzing && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-beige-cream border border-wellness-border flex items-center justify-center text-wellness-muted/70 mb-3 shadow-xs">
                  <ImageIcon className="w-7 h-7 stroke-1 text-olive/70" />
                </div>
                <span className="text-sm font-semibold text-wellness-dark">
                  Awaiting Meal Photo
                </span>
                <p className="text-xs text-wellness-muted max-w-xs mt-1">
                  Upload an image or pick a sample above to view itemized food identification, estimated portions, calories, and macro breakdown.
                </p>

                {/* Empty placeholder skeletons */}
                <div className="w-full space-y-2 mt-6">
                  <div className="h-10 rounded-xl bg-beige-cream/30 border border-wellness-border/50 animate-pulse" />
                  <div className="h-10 rounded-xl bg-beige-cream/30 border border-wellness-border/50 animate-pulse" />
                  <div className="h-10 rounded-xl bg-beige-cream/30 border border-wellness-border/50 animate-pulse" />
                </div>
              </div>
            )}

            {/* Loading / Analyzing State */}
            {isAnalyzing && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-olive/10 border border-olive/20 flex items-center justify-center text-olive">
                  <Loader2 className="w-6 h-6 animate-spin text-olive" />
                </div>
                <div>
                  <div className="text-sm font-bold text-wellness-dark">
                    Vision Engine Processing...
                  </div>
                  <div className="text-xs text-wellness-muted mt-1 max-w-xs">
                    Detecting distinct food items, portion sizes, preparation methods, and calculating macronutrient estimates.
                  </div>
                </div>
              </div>
            )}

            {/* Active Analysis Results */}
            {scanResult && !isAnalyzing && (
              <div className="space-y-4">
                {/* Sub-feature 4.4: Allergy & Condition Banners */}
                {scanResult.allergyAlert && (
                  <div className="p-3.5 rounded-2xl bg-red-100 border border-red-300 text-red-900 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                    <div>
                      <span className="font-bold">🚫 Allergy Alert: </span>
                      {scanResult.allergyAlert}
                    </div>
                  </div>
                )}
                {scanResult.conditionAlert && (
                  <div className="p-3.5 rounded-2xl bg-orange-100 border border-orange-300 text-orange-900 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-orange-700 mt-0.5" />
                    <div>
                      <span className="font-bold">⚠️ Condition Warning: </span>
                      {scanResult.conditionAlert}
                    </div>
                  </div>
                )}

                {/* Subfeature 3: Confidence Badge */}
                {(() => {
                  const conf = getConfidenceBadge(scanResult.confidence);
                  return (
                    <div
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs shadow-2xs ${conf.color}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{conf.icon}</div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{conf.label}</span>
                          </div>
                          <p className="text-[11px] opacity-90 mt-0.5">{conf.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Calories & Macro Top Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/80">
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-wellness-muted">
                      <Flame className="w-3 h-3 text-amber-600" />
                      <span>Calories</span>
                    </div>
                    <div className="text-xl font-bold text-wellness-dark mt-0.5">
                      {scanResult.calories}
                    </div>
                    <div className="text-[10px] text-wellness-muted">kcal</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/80">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">
                      Protein
                    </div>
                    <div className="text-xl font-bold text-wellness-dark mt-0.5">
                      {scanResult.protein_g}
                      <span className="text-xs font-normal text-wellness-muted">g</span>
                    </div>
                    <div className="text-[10px] text-wellness-muted">{proteinPct}%</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/80">
                    <div className="text-[10px] uppercase font-bold text-amber-800">
                      Carbs
                    </div>
                    <div className="text-xl font-bold text-wellness-dark mt-0.5">
                      {scanResult.carbs_g}
                      <span className="text-xs font-normal text-wellness-muted">g</span>
                    </div>
                    <div className="text-[10px] text-wellness-muted">{carbsPct}%</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/80">
                    <div className="text-[10px] uppercase font-bold text-orange-800">
                      Fat
                    </div>
                    <div className="text-xl font-bold text-wellness-dark mt-0.5">
                      {scanResult.fat_g}
                      <span className="text-xs font-normal text-wellness-muted">g</span>
                    </div>
                    <div className="text-[10px] text-wellness-muted">{fatPct}%</div>
                  </div>
                </div>

                {/* Macro Ratio Visual Bar */}
                {totalMacroGrams > 0 && (
                  <div>
                    <div className="flex justify-between text-[11px] text-wellness-muted mb-1 font-medium">
                      <span>Macronutrient Ratio</span>
                      <span>{totalMacroGrams}g Total Macros</span>
                    </div>
                    <div className="h-2.5 w-full bg-beige-cream rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${proteinPct}%` }}
                        className="bg-emerald-600 h-full transition-all"
                        title={`Protein: ${proteinPct}%`}
                      />
                      <div
                        style={{ width: `${carbsPct}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Carbohydrates: ${carbsPct}%`}
                      />
                      <div
                        style={{ width: `${fatPct}%` }}
                        className="bg-orange-500 h-full transition-all"
                        title={`Fat: ${fatPct}%`}
                      />
                    </div>
                  </div>
                )}

                {/* Subfeature 1 & 2: Itemized Food List */}
                <div>
                  <div className="text-xs font-semibold text-wellness-dark uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Identified Food Items ({scanResult.food_items.length})</span>
                    <span className="text-[10px] text-wellness-muted font-normal lowercase">
                      portions & prep methods
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {scanResult.food_items.map((item, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-xl bg-cream-soft border border-wellness-border/80 flex items-center justify-between text-xs"
                      >
                        <div className="font-medium text-wellness-dark truncate mr-2">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.preparation_method && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-olive/10 text-olive font-medium border border-olive/20 capitalize">
                              {item.preparation_method}
                            </span>
                          )}
                          <span className="text-[11px] text-wellness-muted font-medium">
                            {item.estimated_portion}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subfeature 3 & 4: Notes & Caveats */}
                {scanResult.notes && (
                  <div className="p-3 rounded-xl bg-beige-cream/60 border border-wellness-border/80 text-xs space-y-1">
                    <div className="font-semibold text-wellness-dark flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-olive" />
                      <span>Model Assessment & Caveats</span>
                    </div>
                    <p className="text-wellness-dark/90 leading-relaxed text-[11px]">
                      {scanResult.notes}
                    </p>
                  </div>
                )}

                {/* Subfeature 3 Clarification Interactive Prompt */}
                {scanResult.confidence !== 'high' && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Resolve Ambiguity / Refine Scan</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Unsure about an ingredient, dressing, or portion size? Clarify below to refine the calorie and macronutrient breakdown:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={userClarification}
                        onChange={(e) => setUserClarification(e.target.value)}
                        placeholder="e.g. It was grilled with olive oil, no sauce..."
                        disabled={isClarifying || isCoolingDown || rateLimitWait > 0}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-cream-soft border border-amber-300 text-wellness-dark placeholder:text-amber-700/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (isCoolingDown || rateLimitWait > 0) return;
                            handleApplyClarification();
                          }
                        }}
                      />
                      <button
                        onClick={handleApplyClarification}
                        disabled={isClarifying || !userClarification.trim() || isCoolingDown || rateLimitWait > 0}
                        className="px-3 py-1.5 rounded-xl bg-olive hover:bg-olive-light disabled:opacity-50 text-cream-soft font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        {isClarifying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>Refine</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 mt-3 border-t border-wellness-border/50 flex items-center justify-between text-[11px] text-wellness-muted">
            <span>Visual Nutritional Intelligence</span>
            <span>Non-diagnostic wellness reference</span>
          </div>
        </div>
      </div>
    </section>
  );
};
