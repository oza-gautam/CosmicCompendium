# Scientific Modeling Architecture

## Purpose

This document defines the scientific architecture of the Disinfection
Benchmark Modeling Workbench. It serves as the authoritative
specification for mathematical models, optimization, statistics,
validation, and extensibility. All implementations must conform to this
specification.

------------------------------------------------------------------------

# Scientific Pipeline

``` text
Raw CSV
   │
   ▼
Data Validation
   │
   ▼
ICT Calculation
   │
   ▼
Model Selection
   │
   ▼
Parameter Initialization
   │
   ▼
Nonlinear Optimization
   │
   ▼
Goodness-of-Fit
   │
   ▼
Residual Diagnostics
   │
   ▼
Model Quality Score
   │
   ▼
Publication Outputs
```

------------------------------------------------------------------------

# Data Schema

Required fields:

-   Time
-   Residual disinfectant concentration
-   Microbial count (CFU or equivalent)

Optional fields:

-   ICT
-   Dose
-   Replicate
-   Temperature
-   pH
-   Turbidity
-   Particle concentration
-   Organism

------------------------------------------------------------------------

# ICT Engine

If ICT is absent, compute using trapezoidal integration.

\[ ICT=`\int`{=tex}\_0\^T C(t),dt \]

Algorithm:

1.  Sort by time.
2.  Remove invalid records.
3.  Integrate residual concentration.
4.  Store cumulative ICT at each observation.

------------------------------------------------------------------------

# Scientific Model Registry

Each model must expose:

-   Unique ID
-   Display name
-   Scientific description
-   Equation
-   Parameters
-   Initial guesses
-   Parameter bounds
-   Optimizer
-   Prediction function
-   Statistical outputs

Interface:

``` typescript
interface ScientificModel {
  id: string;
  name: string;
  equation: string;
  parameters: ParameterDefinition[];
  initialGuess(data): number[];
  bounds(data): Bounds;
  predict(x, params): number[];
  fit(data): FitResult;
}
```

------------------------------------------------------------------------

# Initial Model Library

## Traditional CT

N = N₀ exp(-kCT)

Parameters

-   k

------------------------------------------------------------------------

## First Order ICT

N = N₀ exp(-kICT)

Parameters

-   k

------------------------------------------------------------------------

## Chick-Watson

Log reduction proportional to disinfectant concentration and exposure
time.

------------------------------------------------------------------------

## Hom Model

Power-law extension of Chick-Watson.

------------------------------------------------------------------------

## Weibull

Captures non-linear microbial survival.

------------------------------------------------------------------------

## Biphasic

Two first-order decay populations.

------------------------------------------------------------------------

## Two Population ICT Model

N = N₀(1−β)e\^(−kd·ICTᵐ) + N₀βe\^(−kp·ICT)

Parameters

-   β
-   kd
-   kp
-   m

Recommended bounds:

-   β: 0--1
-   kd: \>0
-   kp: \>0
-   m: 0.2--5

------------------------------------------------------------------------

# Optimization Engine

Primary algorithm:

-   Levenberg--Marquardt

Fallback:

-   Trust Region Reflective

Support:

-   Parameter bounds
-   Multiple starting points
-   Automatic convergence detection

Outputs:

-   Best-fit parameters
-   Jacobian
-   Hessian approximation
-   Covariance matrix

------------------------------------------------------------------------

# Statistical Engine

Compute:

-   SSE
-   MSE
-   RMSE
-   MAE
-   R²
-   Adjusted R²
-   AIC
-   BIC
-   Log likelihood

Confidence intervals:

-   95%
-   Standard errors
-   t-statistics
-   p-values (when applicable)

------------------------------------------------------------------------

# Diagnostic Engine

Residual analyses:

-   Residual vs ICT
-   QQ Plot
-   Histogram
-   Standardized residuals

Influence:

-   Cook's Distance
-   Leverage

Parameter diagnostics:

-   Covariance matrix
-   Correlation matrix
-   Variance Inflation indicators

------------------------------------------------------------------------

# Model Selection

Rank candidate models using weighted criteria:

1.  Lowest AIC
2.  Lowest BIC
3.  Highest Adjusted R²
4.  Lowest RMSE
5.  Scientific plausibility
6.  Residual randomness

Support side-by-side comparison.

------------------------------------------------------------------------

# Model Quality Score

Overall score: 0--100.

## Weighting

  Category                    Weight
  ------------------------- --------
  Data Quality                   20%
  Optimization                   20%
  Statistical Fit                30%
  Diagnostics                    15%
  Scientific Plausibility        15%

Each deduction must be recorded.

Example:

    Score: 91

    + Complete ICT coverage
    + Stable convergence
    + Strong residual behavior

    - Moderate β/kp correlation (-3)
    - Wide CI for kp (-6)

Ratings:

-   90--100 Excellent
-   75--89 Good
-   60--74 Fair
-   Below 60 Poor

------------------------------------------------------------------------

# Visualization Architecture

Every model automatically generates:

-   Scatter plot
-   Fitted curve
-   Confidence interval
-   Prediction interval
-   Log-scale visualization
-   Residual plots

Support:

-   Multi-sample overlays
-   Small multiples
-   Publication themes

------------------------------------------------------------------------

# Extensibility

New models must require no core code changes.

Adding a model consists of:

1.  Create model plugin.
2.  Register metadata.
3.  Provide equation.
4.  Implement predict().
5.  Implement fit().
6.  Supply parameter definitions.

UI, reports, statistics, and diagnostics should automatically discover
registered models.

------------------------------------------------------------------------

# Reproducibility

Persist:

-   Raw data
-   ICT calculations
-   Parameter bounds
-   Initial guesses
-   Optimizer settings
-   Random seeds
-   Software version
-   Generated figures
-   Reports

Every analysis must be reproducible.

------------------------------------------------------------------------

# Future Roadmap

-   Bayesian parameter estimation
-   Monte Carlo uncertainty propagation
-   Bootstrap confidence intervals
-   Global sensitivity analysis
-   Machine-learning assisted parameter initialization
-   Regulatory benchmark templates
-   Batch processing
-   REST API
-   Jupyter integration
