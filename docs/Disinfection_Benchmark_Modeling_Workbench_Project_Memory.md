# Project Memory: Disinfection Benchmark Modeling Workbench

## Project Vision

Develop a modern scientific web application that enables researchers and
water treatment professionals to analyze disinfectant benchmark studies
using Integrated Contact Time (ICT) and microbial inactivation models.

The application transforms raw laboratory benchmark data into
statistically validated models, publication-quality figures, and
reproducible reports.

## Objectives

-   Import laboratory benchmark datasets
-   Calculate ICT using trapezoidal integration
-   Fit multiple microbial inactivation models
-   Compare models statistically
-   Produce publication-quality charts
-   Compute a transparent Model Quality Score
-   Export reproducible scientific reports

## Workflow

``` text
Upload CSV
    ↓
Validate
    ↓
Calculate ICT
    ↓
Fit Models
    ↓
Evaluate Model Quality
    ↓
Generate Charts
    ↓
Export Report
```

## Data Management

Projects support multiple benchmark datasets (Sample 1--Sample N). CSV
mapping should automatically detect:

-   Time
-   Residual disinfectant
-   ICT (optional)
-   CFU / Total Coliforms
-   Replicate
-   Dose

## ICT Engine

Calculate:

ICT = ∫ C(t) dt

using trapezoidal integration when ICT is not provided.

## Supported Models

-   Traditional CT
-   First-order ICT
-   Chick-Watson
-   Hom
-   Weibull
-   Biphasic
-   Two-Population ICT Model

### Two-Population ICT Model

N = N₀(1−β)e\^(−kd·ICTᵐ) + N₀βe\^(−kp·ICT)

Estimate:

-   β
-   kd
-   kp
-   m

using nonlinear least squares.

## Visualizations

Generate publication-quality:

-   Scatter plots
-   Fitted model curves
-   Confidence bands
-   Prediction bands
-   Log-scale plots
-   Multi-sample overlays

## Statistical Outputs

-   Parameter estimates
-   Confidence intervals
-   Standard errors
-   Covariance matrix
-   Correlation matrix
-   R²
-   Adjusted R²
-   RMSE
-   MAE
-   AIC
-   BIC

## Diagnostics

-   Residual vs ICT
-   Residual histogram
-   QQ Plot
-   Cook's Distance
-   Leverage
-   Standardized residuals

## Model Quality Score

Each fitted model receives a score from **0--100**.

### Data Quality

-   Number of observations
-   Replicate consistency
-   ICT coverage
-   Missing values
-   Outliers

### Optimization Quality

-   Convergence success
-   Parameter stability
-   Hessian quality
-   Covariance quality

### Statistical Quality

-   R²
-   RMSE
-   MAE
-   AIC
-   BIC
-   Residual randomness

### Scientific Quality

-   Parameter plausibility
-   Confidence interval width
-   Parameter identifiability
-   Parameter correlation
-   Overfitting risk

Output:

-   Overall score
-   Rating (Excellent / Good / Fair / Poor)
-   Detailed deductions
-   Recommendations

## Reports

Export:

-   PDF
-   HTML
-   DOCX

Including:

-   Data summary
-   ICT calculations
-   Model fits
-   Figures
-   Diagnostics
-   Model Quality Score
