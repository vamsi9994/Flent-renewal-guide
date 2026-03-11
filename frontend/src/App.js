import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { Lock, Unlock, TrendingUp, Calculator, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

// Lock-in options configuration
const LOCKIN_OPTIONS = [
  { months: 0, label: "No lock-in", discount: 0 },
  { months: 6, label: "6 months", discount: 30 },
  { months: 9, label: "9 months", discount: 40 },
  { months: 11, label: "11 months", discount: 50 },
];

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Animated number component
const AnimatedNumber = ({ value, className, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 300;
    const startValue = displayValue;
    const diff = value - startValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{formatCurrency(displayValue)}{suffix}
    </span>
  );
};

function App() {
  const [currentRent, setCurrentRent] = useState(50000);
  const [escalation, setEscalation] = useState(10);
  const [sliderValue, setSliderValue] = useState([0]);

  // Get current lock-in option based on slider
  const currentOption = LOCKIN_OPTIONS[sliderValue[0]];

  // Calculate escalation amount (monthly increase)
  const escalationAmount = (currentRent * escalation) / 100;

  // Calculate discount on escalation
  const discountAmount = (escalationAmount * currentOption.discount) / 100;

  // New rent after applying discounted escalation
  const newMonthlyRent = currentRent + escalationAmount - discountAmount;

  // Calculate total savings over 11 months
  // Savings = discount per month * 11 months
  const totalSavings = discountAmount * 11;

  // Handle rent input change
  const handleRentChange = useCallback((e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCurrentRent(value ? parseInt(value) : 0);
  }, []);

  // Handle escalation input change
  const handleEscalationChange = useCallback((e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setEscalation(numValue);
    } else if (value === '') {
      setEscalation(0);
    }
  }, []);

  return (
    <div className="App min-h-screen bg-zinc-950">
      {/* Background overlay */}
      <div className="bg-overlay" />

      {/* Content */}
      <div className="content-wrapper">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Renewal Guide
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
              Choose your lock-in period and see how much you can save on your renewal
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Panel - Control Panel */}
            <div className="lg:col-span-5">
              <Card className="bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Calculator className="w-5 h-5 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Your Details
                    </h2>
                  </div>

                  {/* Current Rent Input */}
                  <div className="mb-6">
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                      Current Monthly Rent
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">₹</span>
                      <Input
                        data-testid="rent-input"
                        type="text"
                        value={currentRent.toLocaleString('en-IN')}
                        onChange={handleRentChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-white font-mono text-lg h-14 pl-10"
                        placeholder="50,000"
                      />
                    </div>
                  </div>

                  {/* Standard Escalation Input */}
                  <div className="mb-8">
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                      Standard Escalation
                    </label>
                    <div className="relative">
                      <Input
                        data-testid="escalation-input"
                        type="text"
                        value={escalation}
                        onChange={handleEscalationChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-white font-mono text-lg h-14 pr-10"
                        placeholder="10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">%</span>
                    </div>
                    <p className="text-zinc-600 text-sm mt-2">
                      Monthly escalation: <span className="font-mono text-zinc-400">{formatCurrency(escalationAmount)}</span>
                    </p>
                  </div>

                  {/* Lock-in Slider */}
                  <div>
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-4 block">
                      Choose Lock-in Period
                    </label>
                    <div className="custom-slider px-1" data-testid="lockin-slider">
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={3}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    {/* Slider Markers */}
                    <div className="slider-markers mt-4">
                      {LOCKIN_OPTIONS.map((option, index) => (
                        <span
                          key={option.months}
                          className={`slider-marker text-xs ${sliderValue[0] === index ? 'active' : ''}`}
                        >
                          {option.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-7">
              <Card className="bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden card-hover">
                <CardContent className="p-6 md:p-8">
                  {/* Selected Plan Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentOption.months > 0 ? 'bg-green-500/10' : 'bg-zinc-800'}`}>
                        {currentOption.months > 0 ? (
                          <Lock className="w-5 h-5 text-green-500" />
                        ) : (
                          <Unlock className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {currentOption.label}
                        </h2>
                        <p className="text-zinc-500 text-sm">
                          {currentOption.discount > 0 
                            ? `${currentOption.discount}% off escalation`
                            : 'Standard escalation applies'
                          }
                        </p>
                      </div>
                    </div>
                    {currentOption.discount > 0 && (
                      <div className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                        Save {currentOption.discount}%
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                      <span className="text-zinc-400">Current Rent</span>
                      <span className="font-mono text-white" data-testid="current-rent-display">
                        {formatCurrency(currentRent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                      <span className="text-zinc-400">Escalation ({escalation}%)</span>
                      <span className="font-mono text-white">
                        +{formatCurrency(escalationAmount)}
                      </span>
                    </div>
                    {currentOption.discount > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                        <span className="text-zinc-400">Discount on Escalation</span>
                        <span className="font-mono text-green-400">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* New Monthly Rent */}
                  <div className="bg-zinc-800/50 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">New Monthly Rent</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-zinc-400" />
                          <span className="text-zinc-500 text-sm">Starting next term</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <AnimatedNumber
                          value={newMonthlyRent}
                          className="font-mono text-3xl md:text-4xl font-bold text-white number-transition"
                          data-testid="monthly-rent-display"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Savings - Hero Element */}
                  <div className={`rounded-xl p-6 ${totalSavings > 0 ? 'bg-green-500/5 border border-green-500/20' : 'bg-zinc-800/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-6 h-6 ${totalSavings > 0 ? 'text-green-500' : 'text-zinc-600'}`} />
                        <div>
                          <p className={`text-sm uppercase tracking-wider mb-1 ${totalSavings > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                            Total Savings (11 months)
                          </p>
                          <p className="text-zinc-500 text-xs">
                            Compared to no lock-in option
                          </p>
                        </div>
                      </div>
                      <div data-testid="total-savings-display">
                        <AnimatedNumber
                          value={totalSavings}
                          className={`font-mono text-4xl md:text-5xl font-bold number-transition ${totalSavings > 0 ? 'text-green-400 savings-glow' : 'text-zinc-600'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Offer Cards */}
                  {currentOption.months > 0 && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-4">All Available Offers</p>
                      <div className="grid grid-cols-3 gap-3">
                        {LOCKIN_OPTIONS.filter(opt => opt.discount > 0).map((option) => (
                          <div
                            key={option.months}
                            className={`p-3 rounded-lg text-center transition-all ${
                              currentOption.months === option.months
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-zinc-800/50 border border-transparent'
                            }`}
                          >
                            <p className={`font-mono text-lg font-bold ${
                              currentOption.months === option.months ? 'text-green-400' : 'text-zinc-400'
                            }`}>
                              {option.discount}%
                            </p>
                            <p className="text-zinc-500 text-xs mt-1">{option.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 text-zinc-600 text-sm">
            <p>Savings calculated over the standard 11-month term period</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
