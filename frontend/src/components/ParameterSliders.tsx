"use client";

import type { ModelInfo } from "@/types";

interface Props {
  model: ModelInfo;
  values: number[];
  onChange: (values: number[]) => void;
}

function logSlider(min: number, max: number, value: number): number {
  const safeMin = Math.max(min, 1e-6);
  const safeMax = Math.max(max, safeMin * 10);
  const safeVal = Math.max(Math.min(value, safeMax), safeMin);
  return (
    (Math.log10(safeVal) - Math.log10(safeMin)) /
    (Math.log10(safeMax) - Math.log10(safeMin))
  );
}

function logSliderInverse(min: number, max: number, frac: number): number {
  const safeMin = Math.max(min, 1e-6);
  const safeMax = Math.max(max, safeMin * 10);
  return Math.pow(
    10,
    Math.log10(safeMin) + frac * (Math.log10(safeMax) - Math.log10(safeMin)),
  );
}

function useLogScale(min: number, max: number): boolean {
  return max / Math.max(min, 1e-10) > 100;
}

export default function ParameterSliders({ model, values, onChange }: Props) {
  function update(i: number, v: number) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {model.parameters.map((param, i) => {
        const val = values[i] ?? param.default;
        const isLog = useLogScale(param.min, param.max);
        const sliderFrac = isLog
          ? logSlider(param.min, param.max, val)
          : (val - param.min) / (param.max - param.min);

        return (
          <div key={param.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-sm font-mono font-semibold text-blue-300">
                  {param.name}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  {param.description}
                </span>
              </div>
              <input
                type="number"
                value={val.toPrecision(4)}
                min={param.min}
                max={param.max}
                step={(param.max - param.min) / 1000}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v))
                    update(i, Math.max(param.min, Math.min(param.max, v)));
                }}
                className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 text-right focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-14 text-right font-mono">
                {param.min < 0.01 ? param.min.toExponential(1) : param.min}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={sliderFrac}
                onChange={(e) => {
                  const frac = parseFloat(e.target.value);
                  const v = isLog
                    ? logSliderInverse(param.min, param.max, frac)
                    : param.min + frac * (param.max - param.min);
                  update(i, v);
                }}
                className="flex-1 accent-blue-500 h-1.5 cursor-pointer"
              />
              <span className="text-xs text-slate-600 w-14 font-mono">
                {param.max > 100 ? param.max.toExponential(1) : param.max}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
