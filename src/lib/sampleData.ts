import type { SampleDataset } from '../types'

type Row = Record<string, unknown>

export const SAMPLE_DATASET_CATEGORIES = {
  education: 'Education',
  business: 'Business',
  biology: 'Biology',
  sports: 'Sports',
  environment: 'Environment',
  health: 'Health',
  finance: 'Finance',
  operations: 'Operations',
  social: 'Social Science',
  transport: 'Transport',
  web: 'Web Analytics',
  agriculture: 'Agriculture',
  quality: 'Quality Control',
  public: 'Public Policy',
  realEstate: 'Real Estate',
}

const categories = SAMPLE_DATASET_CATEGORIES

const round = (value: number, digits = 2) => Number(value.toFixed(digits))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const normal = (rand: () => number, mean = 0, sd = 1) => {
  const u1 = Math.max(rand(), Number.EPSILON)
  const u2 = rand()
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}
const pick = <T,>(items: T[], rand: () => number) => items[Math.floor(rand() * items.length)]

const seededRandom = (seed: string) => {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return () => {
    hash += 0x6d2b79f5
    let t = hash
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const makeRows = (id: string, count: number, build: (i: number, rand: () => number) => Row) => {
  const rand = seededRandom(id)
  return Array.from({ length: count }, (_, i) => build(i, rand))
}

const sample = (
  id: string,
  name: string,
  description: string,
  category: string,
  tags: string[],
  rows: number,
  build: (i: number, rand: () => number) => Row
): SampleDataset => ({
  id,
  name,
  description,
  category,
  tags,
  data: makeRows(id, rows, build),
})

export const SAMPLE_DATASETS: SampleDataset[] = [
  sample('student-marks', 'Student Marks', '100 students with marks, attendance, study hours, and grade bands', categories.education, ['descriptive', 'correlation', 'anova'], 100, (i, rand) => {
    const studyHours = round(clamp(normal(rand, 3.8, 1.5), 0.5, 8), 1)
    const attendance = Math.round(clamp(normal(rand, 82, 11), 45, 100))
    const math = Math.round(clamp(38 + studyHours * 7 + attendance * 0.18 + normal(rand, 0, 9), 0, 100))
    const science = Math.round(clamp(35 + studyHours * 6 + attendance * 0.2 + normal(rand, 0, 10), 0, 100))
    const english = Math.round(clamp(42 + studyHours * 4 + attendance * 0.16 + normal(rand, 0, 11), 0, 100))
    const total = math + science + english
    return {
      student_id: i + 1,
      section: pick(['A', 'B', 'C', 'D'], rand),
      gender: pick(['Female', 'Male'], rand),
      study_hours: studyHours,
      attendance_pct: attendance,
      math,
      science,
      english,
      total,
      grade: total >= 255 ? 'A' : total >= 210 ? 'B' : total >= 165 ? 'C' : 'D',
    }
  }),
  sample('monthly-sales', 'Monthly Sales', '24 months of product sales across channels and regions', categories.business, ['time-series', 'forecasting', 'seasonality'], 144, (i, rand) => {
    const month = (i % 24) + 1
    const region = ['North', 'South', 'East', 'West'][Math.floor(i / 36)]
    const channel = pick(['Retail', 'Online', 'Distributor'], rand)
    const season = Math.sin((month / 12) * 2 * Math.PI)
    const units = Math.round(clamp(210 + season * 55 + normal(rand, 0, 35), 80, 420))
    const price = round(clamp(normal(rand, 760, 90), 480, 1050), 2)
    return {
      month: `M${month}`,
      year: month <= 12 ? 2025 : 2026,
      region,
      channel,
      units,
      avg_price: price,
      revenue: Math.round(units * price),
      discount_pct: round(clamp(normal(rand, channel === 'Online' ? 11 : 7, 3), 0, 22), 1),
    }
  }),
  sample('iris-flowers', 'Iris Flowers', 'Synthetic version of the classic iris classification dataset', categories.biology, ['classification', 'scatterplot', 'multivariate'], 150, (i, rand) => {
    const species = ['setosa', 'versicolor', 'virginica'][Math.floor(i / 50)]
    const params: Record<string, [number, number][]> = {
      setosa: [[5.0, 0.35], [3.4, 0.38], [1.46, 0.17], [0.24, 0.11]],
      versicolor: [[5.94, 0.52], [2.77, 0.31], [4.26, 0.47], [1.33, 0.2]],
      virginica: [[6.59, 0.64], [2.97, 0.32], [5.55, 0.55], [2.03, 0.27]],
    }
    const p = params[species]
    return {
      sepal_length: round(normal(rand, p[0][0], p[0][1]), 1),
      sepal_width: round(normal(rand, p[1][0], p[1][1]), 1),
      petal_length: round(normal(rand, p[2][0], p[2][1]), 1),
      petal_width: round(normal(rand, p[3][0], p[3][1]), 1),
      species,
    }
  }),
  sample('cricket-batting', 'Cricket Batting', 'T20 batting statistics for players across teams and roles', categories.sports, ['ranking', 'regression', 'outliers'], 120, (i, rand) => {
    const innings = Math.round(clamp(normal(rand, 28, 10), 5, 60))
    const average = round(clamp(normal(rand, 31, 10), 8, 75), 2)
    return {
      player_id: i + 1,
      team: pick(['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka'], rand),
      role: pick(['Opener', 'Middle Order', 'Finisher', 'All-rounder'], rand),
      innings,
      runs: Math.round(innings * average),
      average,
      strike_rate: round(clamp(normal(rand, 135, 22), 70, 220), 2),
      fours: Math.round(clamp(normal(rand, 36, 18), 0, 100)),
      sixes: Math.round(clamp(normal(rand, 18, 12), 0, 70)),
    }
  }),
  sample('daily-weather', 'Daily Weather', 'One year of daily weather, humidity, rainfall, and wind measures', categories.environment, ['time-series', 'seasonality', 'correlation'], 365, (i, rand) => {
    const day = i + 1
    const season = Math.sin((day / 365) * 2 * Math.PI)
    const humidity = Math.round(clamp(normal(rand, 62 + season * 14, 11), 25, 98))
    return {
      day,
      month: Math.ceil(day / 30.4),
      temp_max: round(clamp(normal(rand, 31 + season * 7, 2.5), 16, 45), 1),
      temp_min: round(clamp(normal(rand, 21 + season * 6, 2), 8, 34), 1),
      humidity,
      rainfall_mm: round(rand() < humidity / 180 ? rand() * 42 : 0, 1),
      wind_speed_kmph: round(clamp(normal(rand, 12, 5), 1, 38), 1),
    }
  }),
  sample('customer-churn', 'Customer Churn', 'Subscription customer behavior with churn labels and usage metrics', categories.business, ['classification', 'logistic-regression', 'retention'], 300, (i, rand) => {
    const tenure = Math.round(clamp(normal(rand, 18, 12), 1, 60))
    const tickets = Math.round(clamp(normal(rand, 2, 1.8), 0, 12))
    const usage = Math.round(clamp(normal(rand, 42 + tenure * 0.7 - tickets * 3, 18), 0, 120))
    const churnRisk = 0.32 + tickets * 0.06 - tenure * 0.006 - usage * 0.003
    return {
      customer_id: `C${1000 + i}`,
      plan: pick(['Basic', 'Pro', 'Enterprise'], rand),
      tenure_months: tenure,
      monthly_fee: round(clamp(normal(rand, 1400, 520), 399, 4999), 2),
      usage_hours: usage,
      support_tickets: tickets,
      region: pick(['Metro', 'Tier 2', 'Tier 3'], rand),
      churned: rand() < clamp(churnRisk, 0.04, 0.78),
    }
  }),
  sample('hospital-readmission', 'Hospital Readmission', 'Patient stay, vitals, and readmission indicators for teaching risk analysis', categories.health, ['classification', 'risk', 'ethics'], 240, (i, rand) => {
    const age = Math.round(clamp(normal(rand, 54, 18), 18, 90))
    const stay = Math.round(clamp(normal(rand, 4 + age / 35, 2.4), 1, 18))
    return {
      patient_id: `P${2000 + i}`,
      age,
      ward: pick(['General', 'Cardiology', 'Orthopedics', 'Pulmonary'], rand),
      length_of_stay_days: stay,
      prior_visits: Math.round(clamp(normal(rand, 1.4, 1.3), 0, 8)),
      discharge_score: Math.round(clamp(normal(rand, 78 - stay * 1.2, 9), 35, 98)),
      readmitted_30d: rand() < clamp(0.08 + age / 500 + stay / 80, 0.05, 0.42),
    }
  }),
  sample('blood-pressure-trial', 'Blood Pressure Trial', 'Before-after blood pressure observations by treatment group', categories.health, ['paired-test', 'anova', 'clinical-trial'], 180, (i, rand) => {
    const group = pick(['Control', 'Diet', 'Medication'], rand)
    const baseline = Math.round(clamp(normal(rand, 142, 13), 110, 185))
    const effect = group === 'Medication' ? 13 : group === 'Diet' ? 7 : 2
    return {
      subject_id: i + 1,
      group,
      age: Math.round(clamp(normal(rand, 49, 12), 25, 76)),
      baseline_systolic: baseline,
      week12_systolic: Math.round(clamp(baseline - effect + normal(rand, 0, 8), 95, 180)),
      adherence_pct: Math.round(clamp(normal(rand, group === 'Control' ? 72 : 84, 12), 35, 100)),
    }
  }),
  sample('loan-applications', 'Loan Applications', 'Applicant income, credit, loan amount, and approval outcome', categories.finance, ['classification', 'fairness', 'risk'], 260, (i, rand) => {
    const income = Math.round(clamp(normal(rand, 720000, 260000), 180000, 2200000))
    const credit = Math.round(clamp(normal(rand, 690, 70), 420, 850))
    const amount = Math.round(clamp(normal(rand, income * 1.4, 350000), 100000, 4500000))
    return {
      application_id: `L${3000 + i}`,
      employment: pick(['Salaried', 'Self-employed', 'Contract'], rand),
      annual_income: income,
      credit_score: credit,
      loan_amount: amount,
      debt_to_income: round(clamp(normal(rand, 0.32, 0.13), 0.03, 0.82), 2),
      approved: credit > 650 && amount / income < 2.6 && rand() > 0.16,
    }
  }),
  sample('stock-returns', 'Stock Returns', 'Daily returns for sectors with volatility and market factors', categories.finance, ['time-series', 'volatility', 'correlation'], 252, (i, rand) => ({
    trading_day: i + 1,
    sector: pick(['Banking', 'IT', 'Pharma', 'Auto', 'FMCG'], rand),
    market_return_pct: round(normal(rand, 0.05, 1.1), 2),
    stock_return_pct: round(normal(rand, 0.08, 1.7), 2),
    volume_millions: round(clamp(normal(rand, 5.2, 2.6), 0.2, 22), 2),
    volatility_pct: round(clamp(normal(rand, 1.8, 0.7), 0.3, 5.5), 2),
  })),
  sample('campaign-ab-test', 'Campaign A/B Test', 'Marketing experiment impressions, clicks, conversions, and revenue', categories.business, ['ab-test', 'proportion-test', 'conversion'], 220, (i, rand) => {
    const variant = i % 2 === 0 ? 'A' : 'B'
    const impressions = Math.round(clamp(normal(rand, 950, 240), 300, 1800))
    const ctr = variant === 'B' ? 0.082 : 0.068
    const clicks = Math.round(impressions * clamp(normal(rand, ctr, 0.018), 0.01, 0.16))
    const conversions = Math.round(clicks * clamp(normal(rand, variant === 'B' ? 0.12 : 0.1, 0.04), 0.01, 0.28))
    return {
      campaign_day: i + 1,
      variant,
      channel: pick(['Search', 'Social', 'Email', 'Display'], rand),
      impressions,
      clicks,
      conversions,
      revenue: Math.round(conversions * clamp(normal(rand, 980, 180), 300, 1600)),
    }
  }),
  sample('ecommerce-orders', 'E-commerce Orders', 'Order values, delivery speed, category, and return flags', categories.business, ['segmentation', 'chi-square', 'outliers'], 320, (i, rand) => {
    const category = pick(['Electronics', 'Fashion', 'Home', 'Beauty', 'Books'], rand)
    const value = round(clamp(normal(rand, category === 'Electronics' ? 4200 : 1600, 850), 150, 30000), 2)
    return {
      order_id: `O${5000 + i}`,
      category,
      payment_method: pick(['UPI', 'Card', 'COD', 'Wallet'], rand),
      order_value: value,
      delivery_days: Math.round(clamp(normal(rand, 3.6, 1.4), 1, 10)),
      customer_rating: Math.round(clamp(normal(rand, 4.1, 0.7), 1, 5)),
      returned: rand() < (category === 'Fashion' ? 0.18 : 0.08),
    }
  }),
  sample('call-center', 'Call Center Performance', 'Agent workload, wait times, resolution, and satisfaction', categories.operations, ['queueing', 'performance', 'service-quality'], 180, (i, rand) => {
    const calls = Math.round(clamp(normal(rand, 54, 14), 12, 95))
    const wait = round(clamp(normal(rand, 120, 58), 5, 420), 1)
    return {
      agent_id: `A${(i % 30) + 1}`,
      shift: pick(['Morning', 'Evening', 'Night'], rand),
      calls_handled: calls,
      avg_wait_seconds: wait,
      avg_handle_minutes: round(clamp(normal(rand, 6.4, 1.8), 2, 15), 1),
      first_call_resolution_pct: Math.round(clamp(normal(rand, 78 - wait / 25, 9), 35, 98)),
      csat_score: round(clamp(normal(rand, 4.2 - wait / 450, 0.45), 1, 5), 2),
    }
  }),
  sample('manufacturing-defects', 'Manufacturing Defects', 'Batch-level defect counts, machine settings, and operators', categories.quality, ['poisson', 'control-chart', 'process-capability'], 210, (i, rand) => {
    const batchSize = Math.round(clamp(normal(rand, 980, 90), 700, 1250))
    const temp = round(clamp(normal(rand, 184, 7), 165, 205), 1)
    const defectRate = clamp(0.018 + Math.abs(temp - 184) / 2500 + rand() * 0.015, 0.005, 0.08)
    return {
      batch_id: `B${7000 + i}`,
      machine: pick(['M1', 'M2', 'M3', 'M4'], rand),
      operator_shift: pick(['A', 'B', 'C'], rand),
      batch_size: batchSize,
      temperature_c: temp,
      pressure_bar: round(clamp(normal(rand, 6.2, 0.6), 4.5, 8), 2),
      defects: Math.round(batchSize * defectRate),
    }
  }),
  sample('survey-satisfaction', 'Survey Satisfaction', 'Likert-scale responses with demographics and service use', categories.social, ['likert', 'ordinal', 'factor-analysis'], 260, (i, rand) => ({
    respondent_id: i + 1,
    age_group: pick(['18-24', '25-34', '35-44', '45-54', '55+'], rand),
    city_tier: pick(['Metro', 'Tier 2', 'Tier 3'], rand),
    ease_of_use: Math.round(clamp(normal(rand, 4.0, 0.8), 1, 5)),
    value_for_money: Math.round(clamp(normal(rand, 3.7, 0.9), 1, 5)),
    support_quality: Math.round(clamp(normal(rand, 3.9, 0.85), 1, 5)),
    recommend_score: Math.round(clamp(normal(rand, 7.4, 1.8), 0, 10)),
  })),
  sample('city-air-quality', 'City Air Quality', 'Daily pollution, weather, and traffic indicators across cities', categories.environment, ['multivariate', 'time-series', 'public-health'], 300, (i, rand) => {
    const traffic = Math.round(clamp(normal(rand, 68, 15), 20, 100))
    return {
      day: (i % 100) + 1,
      city: pick(['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'], rand),
      pm25: round(clamp(normal(rand, 42 + traffic * 0.55, 22), 5, 250), 1),
      no2: round(clamp(normal(rand, 24 + traffic * 0.22, 9), 3, 90), 1),
      temperature_c: round(clamp(normal(rand, 29, 5), 12, 43), 1),
      wind_speed_kmph: round(clamp(normal(rand, 10, 4), 1, 30), 1),
      traffic_index: traffic,
    }
  }),
  sample('crop-yield', 'Crop Yield', 'Farm yield by rainfall, fertilizer, soil quality, and crop type', categories.agriculture, ['regression', 'interaction', 'prediction'], 240, (i, rand) => {
    const rainfall = round(clamp(normal(rand, 820, 190), 250, 1400), 1)
    const fertilizer = round(clamp(normal(rand, 92, 28), 20, 180), 1)
    return {
      farm_id: `F${9000 + i}`,
      crop: pick(['Rice', 'Wheat', 'Maize', 'Cotton', 'Pulses'], rand),
      soil_type: pick(['Alluvial', 'Black', 'Red', 'Laterite'], rand),
      rainfall_mm: rainfall,
      fertilizer_kg_per_acre: fertilizer,
      soil_ph: round(clamp(normal(rand, 6.8, 0.55), 5, 8.5), 2),
      yield_tons_per_hectare: round(clamp(1.2 + rainfall / 550 + fertilizer / 100 + normal(rand, 0, 0.55), 0.4, 8.5), 2),
    }
  }),
  sample('housing-prices', 'Housing Prices', 'Property prices with location, area, age, and amenities', categories.realEstate, ['multiple-regression', 'hedonic-pricing', 'outliers'], 280, (i, rand) => {
    const area = Math.round(clamp(normal(rand, 1180, 420), 350, 3200))
    const age = Math.round(clamp(normal(rand, 9, 7), 0, 40))
    const bedrooms = Math.round(clamp(area / 520 + normal(rand, 0, 0.5), 1, 6))
    return {
      property_id: `H${4000 + i}`,
      city_zone: pick(['Central', 'North', 'South', 'East', 'West'], rand),
      area_sqft: area,
      bedrooms,
      property_age_years: age,
      near_metro: rand() < 0.42,
      price_lakhs: round(clamp(area * 0.085 + bedrooms * 8 - age * 1.2 + (rand() < 0.42 ? 18 : 0) + normal(rand, 0, 22), 18, 520), 2),
    }
  }),
  sample('traffic-accidents', 'Traffic Accidents', 'Road incident severity by time, weather, road type, and vehicles', categories.transport, ['categorical', 'logistic-regression', 'risk'], 260, (i, rand) => ({
    incident_id: `T${6000 + i}`,
    hour: Math.floor(rand() * 24),
    road_type: pick(['Highway', 'Urban arterial', 'Residential', 'Rural'], rand),
    weather: pick(['Clear', 'Rain', 'Fog', 'Dust'], rand),
    vehicles_involved: Math.round(clamp(normal(rand, 1.8, 0.8), 1, 6)),
    speed_limit: pick([30, 40, 60, 80, 100], rand),
    severity: pick(['Minor', 'Moderate', 'Major'], rand),
  })),
  sample('web-analytics', 'Web Analytics', 'Daily site sessions, traffic source, bounce, and conversion metrics', categories.web, ['funnel', 'time-series', 'conversion'], 240, (i, rand) => {
    const sessions = Math.round(clamp(normal(rand, 4200, 1300), 900, 10000))
    const source = pick(['Organic', 'Paid', 'Referral', 'Direct', 'Social'], rand)
    return {
      day: i + 1,
      source,
      sessions,
      bounce_rate_pct: round(clamp(normal(rand, source === 'Paid' ? 48 : 39, 8), 12, 82), 1),
      pages_per_session: round(clamp(normal(rand, 3.2, 0.9), 1, 8), 2),
      conversions: Math.round(sessions * clamp(normal(rand, source === 'Organic' ? 0.036 : 0.027, 0.012), 0.002, 0.09)),
    }
  }),
  sample('restaurant-reviews', 'Restaurant Reviews', 'Restaurant ratings, cuisine, wait times, and repeat visits', categories.business, ['ordinal', 'sentiment', 'segmentation'], 220, (i, rand) => {
    const wait = Math.round(clamp(normal(rand, 18, 8), 2, 55))
    const rating = Math.round(clamp(normal(rand, 4.3 - wait / 60, 0.6), 1, 5))
    return {
      review_id: i + 1,
      cuisine: pick(['Indian', 'Chinese', 'Italian', 'Cafe', 'Fast Food'], rand),
      meal_period: pick(['Breakfast', 'Lunch', 'Dinner'], rand),
      wait_minutes: wait,
      bill_amount: Math.round(clamp(normal(rand, 950, 420), 150, 4500)),
      rating,
      repeat_visit: rating >= 4 && rand() > 0.25,
    }
  }),
  sample('employee-performance', 'Employee Performance', 'Employee engagement, training, output, and appraisal data', categories.business, ['hr-analytics', 'regression', 'anova'], 240, (i, rand) => {
    const training = round(clamp(normal(rand, 18, 9), 0, 60), 1)
    const engagement = Math.round(clamp(normal(rand, 72, 14), 20, 100))
    return {
      employee_id: `E${1000 + i}`,
      department: pick(['Sales', 'Support', 'Engineering', 'Operations', 'Finance'], rand),
      tenure_years: round(clamp(normal(rand, 4.8, 3.4), 0.2, 18), 1),
      training_hours: training,
      engagement_score: engagement,
      output_score: Math.round(clamp(42 + training * 0.45 + engagement * 0.45 + normal(rand, 0, 9), 20, 100)),
      attrition_risk: pick(['Low', 'Medium', 'High'], rand),
    }
  }),
  sample('app-crash-logs', 'App Crash Logs', 'Mobile app versions, device types, sessions, and crash counts', categories.web, ['poisson', 'reliability', 'monitoring'], 180, (i, rand) => {
    const sessions = Math.round(clamp(normal(rand, 3400, 900), 800, 7200))
    const version = pick(['2.8.0', '2.8.1', '2.9.0', '3.0.0'], rand)
    return {
      date_index: i + 1,
      app_version: version,
      platform: pick(['Android', 'iOS'], rand),
      sessions,
      crashes: Math.round(sessions * clamp(normal(rand, version === '3.0.0' ? 0.009 : 0.004, 0.002), 0.0005, 0.02)),
      avg_memory_mb: Math.round(clamp(normal(rand, 310, 75), 120, 680)),
      network_errors: Math.round(clamp(normal(rand, 48, 24), 0, 180)),
    }
  }),
  sample('energy-consumption', 'Energy Consumption', 'Hourly energy demand with weather and weekday indicators', categories.environment, ['time-series', 'forecasting', 'seasonality'], 336, (i, rand) => {
    const hour = i % 24
    const day = Math.floor(i / 24) + 1
    const temp = round(clamp(normal(rand, 28 + Math.sin(day / 14) * 5, 3), 12, 42), 1)
    const peak = hour >= 18 && hour <= 22 ? 160 : hour >= 9 && hour <= 17 ? 90 : 0
    return {
      day,
      hour,
      weekday: pick(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], rand),
      temperature_c: temp,
      demand_mw: round(clamp(520 + peak + Math.abs(temp - 24) * 14 + normal(rand, 0, 35), 320, 980), 1),
      renewable_share_pct: round(clamp(normal(rand, 28, 9), 4, 62), 1),
    }
  }),
  sample('water-quality', 'Water Quality', 'River water chemistry, turbidity, bacteria, and compliance labels', categories.environment, ['multivariate', 'classification', 'environmental'], 210, (i, rand) => {
    const turbidity = round(clamp(normal(rand, 7, 5), 0.2, 35), 2)
    return {
      sample_id: `W${8000 + i}`,
      site: pick(['Upstream', 'Midstream', 'Industrial', 'Downstream'], rand),
      ph: round(clamp(normal(rand, 7.2, 0.55), 5.5, 9.2), 2),
      dissolved_oxygen_mg_l: round(clamp(normal(rand, 6.8 - turbidity / 18, 1.1), 2, 11), 2),
      turbidity_ntu: turbidity,
      nitrate_mg_l: round(clamp(normal(rand, 2.8, 1.5), 0.1, 12), 2),
      compliant: turbidity < 12 && rand() > 0.12,
    }
  }),
  sample('vaccine-outreach', 'Vaccine Outreach', 'Community outreach, appointments, coverage, and no-show rates', categories.public, ['proportion', 'public-health', 'equity'], 180, (i, rand) => {
    const outreach = Math.round(clamp(normal(rand, 4.2, 2), 0, 12))
    const appointments = Math.round(clamp(normal(rand, 86 + outreach * 8, 24), 15, 180))
    return {
      block_id: `BLK${i + 1}`,
      district: pick(['North', 'South', 'East', 'West', 'Central'], rand),
      outreach_events: outreach,
      appointments,
      no_show_rate_pct: round(clamp(normal(rand, 18 - outreach, 5), 2, 45), 1),
      coverage_pct: round(clamp(normal(rand, 62 + outreach * 2.4, 12), 20, 98), 1),
      mobile_clinic: rand() < 0.35,
    }
  }),
  sample('exam-item-analysis', 'Exam Item Analysis', 'Question difficulty, discrimination, and topic-level performance', categories.education, ['psychometrics', 'reliability', 'difficulty'], 120, (i, rand) => ({
    item_id: `Q${i + 1}`,
    topic: pick(['Algebra', 'Geometry', 'Statistics', 'Probability', 'Calculus'], rand),
    difficulty_pct_correct: round(clamp(normal(rand, 62, 18), 8, 98), 1),
    discrimination_index: round(clamp(normal(rand, 0.32, 0.16), -0.2, 0.75), 2),
    avg_time_seconds: Math.round(clamp(normal(rand, 92, 35), 18, 260)),
    option_a_pct: round(rand() * 60, 1),
    flagged_for_review: rand() < 0.12,
  })),
  sample('library-circulation', 'Library Circulation', 'Book loans, genres, member type, renewals, and late returns', categories.education, ['categorical', 'chi-square', 'counts'], 260, (i, rand) => {
    const days = Math.round(clamp(normal(rand, 16, 8), 1, 60))
    return {
      loan_id: `LB${i + 1}`,
      genre: pick(['Fiction', 'Science', 'History', 'Business', 'Children', 'Technology'], rand),
      member_type: pick(['Student', 'Faculty', 'Public'], rand),
      loan_days: days,
      renewals: Math.round(clamp(normal(rand, 0.8, 0.9), 0, 4)),
      late_return: days > 24 && rand() > 0.35,
      fine_amount: days > 24 ? Math.round((days - 24) * pick([2, 5, 10], rand)) : 0,
    }
  }),
  sample('movie-box-office', 'Movie Box Office', 'Film budgets, genres, reviews, screens, and earnings', categories.business, ['regression', 'skewness', 'outliers'], 180, (i, rand) => {
    const budget = round(clamp(normal(rand, 34, 24), 1, 180), 2)
    const screens = Math.round(clamp(normal(rand, 850 + budget * 18, 420), 50, 4500))
    return {
      movie_id: `MV${i + 1}`,
      genre: pick(['Drama', 'Action', 'Comedy', 'Thriller', 'Romance'], rand),
      budget_crore: budget,
      screens,
      critic_score: Math.round(clamp(normal(rand, 63, 16), 5, 98)),
      opening_weekend_crore: round(clamp(budget * 0.35 + screens * 0.006 + normal(rand, 0, 12), 0.2, 250), 2),
      hit_status: pick(['Flop', 'Average', 'Hit', 'Blockbuster'], rand),
    }
  }),
  sample('insurance-claims', 'Insurance Claims', 'Policyholder profiles, claim amounts, and fraud review labels', categories.finance, ['skewness', 'classification', 'risk'], 260, (i, rand) => {
    const claim = round(clamp(Math.exp(normal(rand, 10.1, 0.8)), 2000, 400000), 2)
    return {
      claim_id: `IC${i + 1}`,
      policy_type: pick(['Health', 'Auto', 'Home', 'Travel'], rand),
      policy_age_years: round(clamp(normal(rand, 4.2, 3), 0.1, 18), 1),
      claim_amount: claim,
      previous_claims: Math.round(clamp(normal(rand, 1.1, 1.2), 0, 8)),
      processing_days: Math.round(clamp(normal(rand, 9 + claim / 40000, 5), 1, 45)),
      fraud_review: rand() < clamp(0.04 + claim / 900000, 0.03, 0.4),
    }
  }),
  sample('telecom-network', 'Telecom Network', 'Cell tower traffic, latency, packet loss, and outage events', categories.operations, ['monitoring', 'time-series', 'anomaly'], 240, (i, rand) => {
    const traffic = round(clamp(normal(rand, 420, 160), 60, 1050), 1)
    return {
      tower_id: `TW${(i % 40) + 1}`,
      hour: i % 24,
      region: pick(['Urban', 'Suburban', 'Rural'], rand),
      traffic_gb: traffic,
      avg_latency_ms: round(clamp(normal(rand, 38 + traffic / 55, 12), 10, 160), 1),
      packet_loss_pct: round(clamp(normal(rand, 0.7 + traffic / 1000, 0.45), 0, 5), 2),
      outage_minutes: rand() < 0.08 ? Math.round(rand() * 90) : 0,
    }
  }),
  sample('supply-chain-delays', 'Supply Chain Delays', 'Shipment delay times by lane, carrier, distance, and mode', categories.operations, ['survival', 'logistics', 'regression'], 280, (i, rand) => {
    const distance = Math.round(clamp(normal(rand, 820, 410), 40, 2600))
    return {
      shipment_id: `SHP${i + 1}`,
      mode: pick(['Road', 'Rail', 'Air', 'Sea'], rand),
      carrier: pick(['Carrier A', 'Carrier B', 'Carrier C', 'Carrier D'], rand),
      distance_km: distance,
      planned_days: round(clamp(distance / 480 + normal(rand, 1.4, 0.8), 0.5, 18), 1),
      actual_days: round(clamp(distance / 430 + normal(rand, 1.8, 1.3), 0.5, 25), 1),
      delayed: rand() < clamp(0.16 + distance / 6000, 0.08, 0.62),
    }
  }),
  sample('hotel-occupancy', 'Hotel Occupancy', 'Daily room occupancy, rates, channel mix, and events', categories.business, ['time-series', 'seasonality', 'revenue-management'], 240, (i, rand) => {
    const weekend = i % 7 >= 5
    const event = rand() < 0.12
    return {
      day: i + 1,
      weekday: pick(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], rand),
      event_nearby: event,
      occupancy_pct: round(clamp(normal(rand, weekend ? 78 : 62, 14) + (event ? 12 : 0), 18, 100), 1),
      average_daily_rate: round(clamp(normal(rand, weekend ? 4800 : 3900, 900) + (event ? 900 : 0), 1400, 9500), 2),
      online_share_pct: round(clamp(normal(rand, 56, 13), 12, 92), 1),
    }
  }),
  sample('retail-basket', 'Retail Basket', 'Market-basket style transactions with category counts and spend', categories.business, ['association', 'segmentation', 'counts'], 300, (i, rand) => {
    const items = Math.round(clamp(normal(rand, 7, 3), 1, 24))
    return {
      basket_id: `BK${i + 1}`,
      store_format: pick(['Supermarket', 'Express', 'Hypermarket'], rand),
      daypart: pick(['Morning', 'Afternoon', 'Evening'], rand),
      items_count: items,
      grocery_items: Math.round(clamp(normal(rand, items * 0.45, 2), 0, items)),
      personal_care_items: Math.round(clamp(normal(rand, items * 0.18, 1.4), 0, items)),
      bill_total: round(clamp(items * normal(rand, 145, 45), 80, 12000), 2),
      used_coupon: rand() < 0.28,
    }
  }),
  sample('credit-card-transactions', 'Credit Card Transactions', 'Transaction amounts, merchant categories, and fraud flags', categories.finance, ['anomaly', 'classification', 'skewness'], 360, (i, rand) => {
    const amount = round(clamp(Math.exp(normal(rand, 6.3, 1.15)), 20, 250000), 2)
    return {
      txn_id: `TX${i + 1}`,
      merchant_category: pick(['Fuel', 'Travel', 'Grocery', 'Electronics', 'Dining', 'ATM'], rand),
      amount,
      hour: Math.floor(rand() * 24),
      international: rand() < 0.14,
      card_present: rand() < 0.68,
      fraud_flag: rand() < clamp(0.01 + (amount > 50000 ? 0.09 : 0) + (rand() < 0.14 ? 0.03 : 0), 0.005, 0.22),
    }
  }),
  sample('fitness-tracker', 'Fitness Tracker', 'Daily steps, sleep, heart rate, calories, and activity minutes', categories.health, ['time-series', 'personal-analytics', 'correlation'], 210, (i, rand) => {
    const steps = Math.round(clamp(normal(rand, 7600, 2900), 600, 22000))
    return {
      day: i + 1,
      steps,
      sleep_hours: round(clamp(normal(rand, 6.8, 1.1), 3.5, 10.5), 1),
      resting_hr: Math.round(clamp(normal(rand, 72 - steps / 3000, 7), 48, 105)),
      active_minutes: Math.round(clamp(steps / 120 + normal(rand, 0, 18), 0, 180)),
      calories: Math.round(clamp(1650 + steps * 0.045 + normal(rand, 0, 220), 1100, 3600)),
    }
  }),
  sample('sleep-study', 'Sleep Study', 'Sleep duration, caffeine, screen time, and quality scores', categories.health, ['correlation', 'multiple-regression', 'behavior'], 180, (i, rand) => {
    const caffeine = Math.round(clamp(normal(rand, 160, 95), 0, 520))
    const screen = round(clamp(normal(rand, 2.8, 1.5), 0, 8), 1)
    return {
      participant_id: `SL${i + 1}`,
      age: Math.round(clamp(normal(rand, 34, 11), 18, 70)),
      caffeine_mg: caffeine,
      evening_screen_hours: screen,
      exercise_minutes: Math.round(clamp(normal(rand, 32, 24), 0, 150)),
      sleep_hours: round(clamp(normal(rand, 7.4 - caffeine / 420 - screen * 0.18, 0.85), 3.5, 10), 1),
      sleep_quality_score: Math.round(clamp(normal(rand, 76 - caffeine / 18 - screen * 3, 13), 10, 100)),
    }
  }),
  sample('school-attendance', 'School Attendance', 'Daily attendance by class with events, weather, and test days', categories.education, ['time-series', 'proportion', 'education-policy'], 220, (i, rand) => {
    const rain = rand() < 0.28
    return {
      school_day: i + 1,
      class_grade: pick(['6', '7', '8', '9', '10'], rand),
      enrollment: Math.round(clamp(normal(rand, 42, 6), 25, 60)),
      attendance_pct: round(clamp(normal(rand, rain ? 82 : 91, 6), 55, 100), 1),
      rainfall_mm: rain ? round(rand() * 45, 1) : 0,
      exam_day: rand() < 0.1,
      holiday_adjacent: rand() < 0.08,
    }
  }),
  sample('college-admissions', 'College Admissions', 'Applicant test scores, GPA, activities, and admission decisions', categories.education, ['classification', 'fairness', 'selection'], 260, (i, rand) => {
    const score = Math.round(clamp(normal(rand, 68, 14), 20, 100))
    const gpa = round(clamp(normal(rand, 7.6, 1.1), 4, 10), 2)
    return {
      applicant_id: `ADM${i + 1}`,
      program: pick(['Science', 'Commerce', 'Arts', 'Engineering'], rand),
      test_score: score,
      gpa,
      activities_count: Math.round(clamp(normal(rand, 3, 1.8), 0, 10)),
      first_gen_student: rand() < 0.22,
      admitted: score + gpa * 8 + normal(rand, 0, 12) > 128,
    }
  }),
  sample('machine-sensor', 'Machine Sensor', 'Minute-level sensor readings with vibration and fault labels', categories.quality, ['anomaly', 'predictive-maintenance', 'time-series'], 360, (i, rand) => {
    const vibration = round(clamp(normal(rand, 2.1, 0.7), 0.3, 6), 2)
    return {
      minute: i + 1,
      machine_id: `MC${(i % 12) + 1}`,
      temperature_c: round(clamp(normal(rand, 67 + vibration * 2, 6), 45, 105), 1),
      vibration_mm_s: vibration,
      pressure_bar: round(clamp(normal(rand, 5.8, 0.7), 3.5, 8.5), 2),
      power_kw: round(clamp(normal(rand, 24, 5), 10, 45), 1),
      fault: vibration > 3.5 && rand() > 0.45,
    }
  }),
  sample('lab-measurements', 'Lab Measurements', 'Repeated lab readings for method comparison and measurement error', categories.quality, ['measurement-error', 'bland-altman', 'repeatability'], 180, (i, rand) => {
    const trueValue = normal(rand, 50, 12)
    return {
      sample_id: `LAB${Math.floor(i / 3) + 1}`,
      replicate: (i % 3) + 1,
      method: pick(['Reference', 'New Method'], rand),
      measured_value: round(clamp(trueValue + normal(rand, 0, 2.8), 5, 95), 2),
      technician: pick(['T1', 'T2', 'T3', 'T4'], rand),
      batch: pick(['Batch A', 'Batch B', 'Batch C'], rand),
    }
  }),
  sample('bank-branches', 'Bank Branches', 'Branch deposits, footfall, staffing, and cross-sell performance', categories.finance, ['benchmarking', 'clustering', 'performance'], 160, (i, rand) => {
    const footfall = Math.round(clamp(normal(rand, 380, 140), 60, 900))
    return {
      branch_id: `BR${i + 1}`,
      location_type: pick(['Metro', 'Urban', 'Semi-urban', 'Rural'], rand),
      staff_count: Math.round(clamp(normal(rand, 12, 5), 3, 32)),
      monthly_footfall: footfall,
      deposits_crore: round(clamp(normal(rand, 28 + footfall / 80, 13), 2, 110), 2),
      loan_accounts_opened: Math.round(clamp(normal(rand, footfall / 18, 9), 0, 85)),
      customer_satisfaction: round(clamp(normal(rand, 4.0, 0.55), 1, 5), 2),
    }
  }),
  sample('microfinance-groups', 'Microfinance Groups', 'Group repayments, loan cycles, savings, and default flags', categories.finance, ['risk', 'panel-data', 'social-impact'], 220, (i, rand) => {
    const cycle = Math.round(clamp(normal(rand, 3, 1.5), 1, 8))
    return {
      group_id: `MFG${i + 1}`,
      district: pick(['Ariyalur', 'Bidar', 'Cuttack', 'Dhar', 'Erode'], rand),
      members: Math.round(clamp(normal(rand, 14, 4), 5, 28)),
      loan_cycle: cycle,
      loan_amount: Math.round(clamp(normal(rand, 65000 + cycle * 9000, 28000), 10000, 250000)),
      savings_balance: Math.round(clamp(normal(rand, 18000 + cycle * 3000, 9000), 1000, 90000)),
      defaulted: rand() < clamp(0.12 - cycle * 0.01, 0.02, 0.22),
    }
  }),
  sample('public-transport-ridership', 'Public Transport Ridership', 'Route-level ridership, delays, fares, and crowding', categories.transport, ['time-series', 'operations', 'forecasting'], 260, (i, rand) => {
    const routeType = pick(['Metro', 'Bus', 'Suburban Rail'], rand)
    const riders = Math.round(clamp(normal(rand, routeType === 'Metro' ? 42000 : 18000, 9000), 1200, 85000))
    return {
      service_day: i + 1,
      route_type: routeType,
      route_id: `R${(i % 30) + 1}`,
      ridership: riders,
      avg_delay_minutes: round(clamp(normal(rand, routeType === 'Bus' ? 9 : 4, 3.5), 0, 35), 1),
      fare_revenue: Math.round(riders * clamp(normal(rand, 22, 5), 8, 45)),
      peak_crowding_pct: round(clamp(normal(rand, 72 + riders / 2500, 13), 20, 140), 1),
    }
  }),
  sample('parking-occupancy', 'Parking Occupancy', 'Parking lot usage by hour, price, events, and occupancy', categories.transport, ['time-series', 'pricing', 'capacity'], 240, (i, rand) => {
    const hour = i % 24
    const event = rand() < 0.1
    return {
      day: Math.floor(i / 24) + 1,
      hour,
      lot_zone: pick(['Central', 'Market', 'Station', 'Hospital'], rand),
      hourly_price: pick([20, 30, 40, 60, 80], rand),
      event_nearby: event,
      occupancy_pct: round(clamp(normal(rand, hour >= 9 && hour <= 20 ? 70 : 32, 18) + (event ? 18 : 0), 2, 100), 1),
      violations: Math.round(clamp(normal(rand, event ? 7 : 2, 2), 0, 18)),
    }
  }),
  sample('crime-incidents', 'Crime Incidents', 'Incident counts by category, location type, time, and closure status', categories.public, ['counts', 'categorical', 'spatial'], 300, (i, rand) => ({
    incident_id: `CR${i + 1}`,
    precinct: pick(['North', 'South', 'East', 'West', 'Central'], rand),
    category: pick(['Theft', 'Assault', 'Burglary', 'Cyber', 'Traffic'], rand),
    hour: Math.floor(rand() * 24),
    location_type: pick(['Street', 'Residence', 'Commercial', 'Transit'], rand),
    response_minutes: round(clamp(normal(rand, 18, 9), 2, 80), 1),
    case_closed: rand() < 0.58,
  })),
  sample('election-polling', 'Election Polling', 'Polling responses by region, demographics, and vote intention', categories.public, ['survey', 'weighting', 'proportions'], 400, (i, rand) => ({
    respondent_id: `EL${i + 1}`,
    region: pick(['North', 'South', 'East', 'West', 'Central'], rand),
    age_group: pick(['18-29', '30-44', '45-59', '60+'], rand),
    gender: pick(['Female', 'Male', 'Other'], rand),
    education: pick(['School', 'Graduate', 'Postgraduate'], rand),
    vote_intent: pick(['Party A', 'Party B', 'Party C', 'Undecided'], rand),
    sample_weight: round(clamp(normal(rand, 1, 0.22), 0.45, 1.85), 2),
  })),
  sample('income-expenditure', 'Income Expenditure', 'Household income, spending, family size, and savings rate', categories.social, ['inequality', 'regression', 'skewness'], 280, (i, rand) => {
    const income = Math.round(clamp(Math.exp(normal(rand, 11.05, 0.58)), 12000, 450000))
    const spend = Math.round(clamp(income * clamp(normal(rand, 0.72, 0.16), 0.25, 1.12), 6000, 400000))
    return {
      household_id: `HH${i + 1}`,
      location_type: pick(['Urban', 'Rural'], rand),
      family_size: Math.round(clamp(normal(rand, 4.2, 1.7), 1, 10)),
      monthly_income: income,
      monthly_expenditure: spend,
      savings_rate_pct: round(clamp((income - spend) / income * 100, -20, 70), 1),
      owns_home: rand() < 0.56,
    }
  }),
  sample('nutrition-diet', 'Nutrition Diet', 'Daily nutrition intake, activity level, and health goals', categories.health, ['correlation', 'composition', 'wellness'], 220, (i, rand) => {
    const calories = Math.round(clamp(normal(rand, 2100, 520), 900, 4200))
    return {
      participant_id: `NT${i + 1}`,
      diet_type: pick(['Mixed', 'Vegetarian', 'Vegan', 'High Protein'], rand),
      calories,
      protein_g: round(clamp(normal(rand, calories / 38, 18), 18, 180), 1),
      carbs_g: round(clamp(normal(rand, calories / 8, 55), 60, 520), 1),
      fat_g: round(clamp(normal(rand, calories / 32, 22), 15, 180), 1),
      activity_level: pick(['Low', 'Moderate', 'High'], rand),
    }
  }),
  sample('pharma-stability', 'Pharma Stability', 'Drug stability measurements by storage condition and month', categories.quality, ['anova', 'degradation', 'experimental-design'], 180, (i, rand) => {
    const month = i % 12
    const condition = pick(['25C/60RH', '30C/65RH', '40C/75RH'], rand)
    const penalty = condition === '40C/75RH' ? month * 1.4 : condition === '30C/65RH' ? month * 0.55 : month * 0.2
    return {
      batch_id: `PH${Math.floor(i / 12) + 1}`,
      month,
      condition,
      assay_pct: round(clamp(normal(rand, 100 - penalty, 1.4), 75, 105), 2),
      impurity_pct: round(clamp(normal(rand, 0.25 + penalty / 30, 0.12), 0.02, 4), 2),
      moisture_pct: round(clamp(normal(rand, 1.8 + penalty / 20, 0.35), 0.5, 5.5), 2),
    }
  }),
  sample('plant-growth', 'Plant Growth', 'Greenhouse plant height, sunlight, watering, and fertilizer response', categories.biology, ['anova', 'growth-curves', 'experiment'], 180, (i, rand) => {
    const fertilizer = pick(['Control', 'Organic', 'NPK'], rand)
    const sunlight = round(clamp(normal(rand, 6.5, 1.7), 2, 11), 1)
    const water = round(clamp(normal(rand, 420, 110), 120, 760), 1)
    return {
      plant_id: `PG${i + 1}`,
      species: pick(['Tomato', 'Basil', 'Bean', 'Marigold'], rand),
      fertilizer,
      sunlight_hours: sunlight,
      water_ml_week: water,
      leaf_count: Math.round(clamp(normal(rand, 18 + sunlight * 1.4, 6), 3, 60)),
      height_cm: round(clamp(9 + sunlight * 2.6 + water / 70 + (fertilizer === 'NPK' ? 8 : fertilizer === 'Organic' ? 5 : 0) + normal(rand, 0, 5), 5, 95), 1),
    }
  }),
  sample('microbial-growth', 'Microbial Growth', 'Culture density by temperature, pH, medium, and incubation time', categories.biology, ['time-series', 'nonlinear-growth', 'lab'], 240, (i, rand) => {
    const hours = i % 48
    const temp = round(clamp(normal(rand, 32, 5), 18, 45), 1)
    const ph = round(clamp(normal(rand, 7.1, 0.6), 5, 9), 2)
    return {
      culture_id: `MG${Math.floor(i / 8) + 1}`,
      hours,
      medium: pick(['LB', 'M9', 'Nutrient Broth'], rand),
      temperature_c: temp,
      ph,
      optical_density: round(clamp(0.08 + hours * 0.035 - Math.abs(temp - 37) * 0.025 - Math.abs(ph - 7) * 0.08 + normal(rand, 0, 0.12), 0.02, 2.4), 3),
      contamination_flag: rand() < 0.04,
    }
  }),
  sample('wildlife-survey', 'Wildlife Survey', 'Field sightings by habitat, season, survey effort, and species count', categories.biology, ['counts', 'ecology', 'sampling'], 220, (i, rand) => {
    const effort = round(clamp(normal(rand, 4.5, 1.8), 1, 10), 1)
    const habitat = pick(['Forest', 'Grassland', 'Wetland', 'Scrub'], rand)
    return {
      transect_id: `WS${i + 1}`,
      habitat,
      season: pick(['Pre-monsoon', 'Monsoon', 'Post-monsoon', 'Winter'], rand),
      effort_hours: effort,
      distance_km: round(clamp(normal(rand, 3.2, 1.1), 0.6, 8), 1),
      species_richness: Math.round(clamp(normal(rand, habitat === 'Wetland' ? 16 : 10, 4) + effort, 1, 35)),
      sightings_count: Math.round(clamp(normal(rand, effort * (habitat === 'Forest' ? 7 : 5), 9), 0, 85)),
    }
  }),
  sample('gene-expression', 'Gene Expression', 'Gene expression intensity across treatment groups and time points', categories.biology, ['multivariate', 'differential-expression', 'bioinformatics'], 300, (i, rand) => {
    const treatment = pick(['Control', 'Drug A', 'Drug B'], rand)
    const timepoint = pick([0, 6, 12, 24, 48], rand)
    const response = treatment === 'Drug A' ? 0.45 : treatment === 'Drug B' ? -0.25 : 0
    return {
      gene_id: `GENE${(i % 60) + 1}`,
      sample_group: treatment,
      timepoint_hours: timepoint,
      expression_log2: round(clamp(normal(rand, 7 + response + timepoint / 80, 1.2), 2, 13), 3),
      gc_content_pct: round(clamp(normal(rand, 49, 8), 25, 75), 1),
      read_count: Math.round(clamp(Math.exp(normal(rand, 9.5 + response, 0.8)), 100, 95000)),
      significant_marker: Math.abs(response) > 0.3 && rand() > 0.55,
    }
  }),
  sample('football-team-stats', 'Football Team Stats', 'Match-level football possession, shots, fouls, and outcomes', categories.sports, ['classification', 'team-performance', 'match-analysis'], 240, (i, rand) => {
    const shots = Math.round(clamp(normal(rand, 11, 4), 1, 28))
    const possession = round(clamp(normal(rand, 50, 12), 20, 80), 1)
    return {
      match_id: `FB${i + 1}`,
      team: pick(['Mumbai FC', 'Kolkata United', 'Chennai City', 'Goa SC', 'Kerala Club'], rand),
      venue: pick(['Home', 'Away', 'Neutral'], rand),
      possession_pct: possession,
      shots,
      shots_on_target: Math.round(clamp(normal(rand, shots * 0.38, 2), 0, shots)),
      fouls: Math.round(clamp(normal(rand, 12, 5), 0, 32)),
      result: possession + shots * 2 + normal(rand, 0, 18) > 72 ? 'Win' : pick(['Draw', 'Loss'], rand),
    }
  }),
  sample('marathon-runners', 'Marathon Runners', 'Runner finish times with age group, training volume, and hydration', categories.sports, ['regression', 'endurance', 'performance'], 260, (i, rand) => {
    const training = round(clamp(normal(rand, 48, 18), 5, 120), 1)
    const age = Math.round(clamp(normal(rand, 36, 11), 18, 72))
    return {
      runner_id: `MR${i + 1}`,
      age,
      gender_group: pick(['Female', 'Male', 'Open'], rand),
      weekly_km: training,
      prior_marathons: Math.round(clamp(normal(rand, 2.4, 2.1), 0, 18)),
      hydration_stops: Math.round(clamp(normal(rand, 7, 2), 1, 14)),
      finish_minutes: round(clamp(330 - training * 1.6 + age * 0.8 + normal(rand, 0, 28), 130, 520), 1),
    }
  }),
  sample('basketball-shots', 'Basketball Shots', 'Shot attempts by court zone, defender distance, and make result', categories.sports, ['logistic-regression', 'spatial', 'shot-quality'], 300, (i, rand) => {
    const distance = round(clamp(normal(rand, 16, 8), 1, 32), 1)
    const defender = round(clamp(normal(rand, 3.5, 1.8), 0.2, 10), 1)
    return {
      shot_id: `BS${i + 1}`,
      player_role: pick(['Guard', 'Forward', 'Center'], rand),
      zone: pick(['Paint', 'Midrange', 'Corner Three', 'Above Break Three'], rand),
      shot_distance_ft: distance,
      defender_distance_ft: defender,
      shot_clock_seconds: round(clamp(normal(rand, 11, 6), 0.5, 24), 1),
      made: rand() < clamp(0.66 - distance / 90 + defender / 30, 0.18, 0.78),
    }
  }),
  sample('kabaddi-raids', 'Kabaddi Raids', 'Raid outcomes by player role, defenders, timing, and bonus attempts', categories.sports, ['categorical', 'risk', 'indian-sports'], 220, (i, rand) => {
    const defenders = Math.round(clamp(normal(rand, 5, 1.5), 1, 7))
    return {
      raid_id: `KB${i + 1}`,
      team: pick(['Bengal', 'Patna', 'Jaipur', 'Pune', 'Delhi'], rand),
      raider_role: pick(['Lead Raider', 'All-rounder', 'Substitute'], rand),
      defenders_on_court: defenders,
      raid_second: Math.round(clamp(normal(rand, 25, 11), 1, 40)),
      bonus_attempt: rand() < 0.28,
      points_scored: Math.round(clamp(normal(rand, 1.4 + (7 - defenders) * 0.25, 1.1), 0, 6)),
      tackled: rand() < clamp(0.42 + defenders * 0.045, 0.22, 0.78),
    }
  }),
  sample('solid-waste-audit', 'Solid Waste Audit', 'Daily waste generation, segregation, recycling, and collection delays', categories.environment, ['sustainability', 'proportion', 'operations'], 240, (i, rand) => {
    const waste = round(clamp(normal(rand, 1250, 360), 220, 2800), 1)
    return {
      ward_id: `WA${(i % 36) + 1}`,
      day: i + 1,
      zone_type: pick(['Residential', 'Market', 'Mixed', 'Institutional'], rand),
      waste_kg: waste,
      wet_waste_pct: round(clamp(normal(rand, 54, 12), 15, 88), 1),
      segregation_pct: round(clamp(normal(rand, 62, 18), 5, 98), 1),
      recycling_kg: round(clamp(waste * normal(rand, 0.18, 0.06), 0, waste * 0.55), 1),
      collection_delayed: rand() < 0.16,
    }
  }),
  sample('warehouse-picking', 'Warehouse Picking', 'Order picking time by zone, picker load, SKU mix, and errors', categories.operations, ['productivity', 'queueing', 'quality'], 260, (i, rand) => {
    const lines = Math.round(clamp(normal(rand, 18, 8), 1, 55))
    return {
      pick_id: `PK${i + 1}`,
      zone: pick(['A', 'B', 'C', 'Cold Storage'], rand),
      shift: pick(['Morning', 'Evening', 'Night'], rand),
      order_lines: lines,
      picker_experience_months: Math.round(clamp(normal(rand, 18, 12), 1, 72)),
      pick_minutes: round(clamp(5 + lines * normal(rand, 1.8, 0.35), 2, 150), 1),
      scan_errors: Math.round(clamp(normal(rand, lines * 0.035, 1), 0, 8)),
    }
  }),
  sample('clinic-appointments', 'Clinic Appointments', 'Appointment demand, wait times, provider load, and no-show flags', categories.operations, ['scheduling', 'service-quality', 'forecasting'], 240, (i, rand) => {
    const booked = Math.round(clamp(normal(rand, 42, 11), 8, 80))
    return {
      clinic_day: i + 1,
      department: pick(['General', 'Dental', 'Pediatrics', 'Dermatology'], rand),
      provider_count: Math.round(clamp(normal(rand, 4, 1.4), 1, 9)),
      appointments_booked: booked,
      walk_ins: Math.round(clamp(normal(rand, 9, 5), 0, 35)),
      avg_wait_minutes: round(clamp(normal(rand, 18 + booked / 5, 9), 2, 95), 1),
      no_show_rate_pct: round(clamp(normal(rand, 13, 5), 1, 38), 1),
    }
  }),
  sample('migration-survey', 'Migration Survey', 'Household migration, remittances, education, and employment status', categories.social, ['survey', 'demographics', 'categorical'], 260, (i, rand) => {
    const remittance = Math.round(clamp(Math.exp(normal(rand, 9.4, 0.9)), 0, 120000))
    return {
      household_id: `MS${i + 1}`,
      origin_region: pick(['North', 'South', 'East', 'West', 'Central'], rand),
      destination_type: pick(['Same State', 'Other State', 'International'], rand),
      education_level: pick(['Primary', 'Secondary', 'Graduate', 'Postgraduate'], rand),
      migrant_members: Math.round(clamp(normal(rand, 1.4, 0.9), 0, 5)),
      monthly_remittance: remittance,
      employment_sector: pick(['Construction', 'Services', 'Manufacturing', 'Domestic Work', 'IT'], rand),
    }
  }),
  sample('digital-access', 'Digital Access', 'Internet access, device ownership, skills, and online service use', categories.social, ['equity', 'ordinal', 'digital-divide'], 280, (i, rand) => ({
    respondent_id: `DA${i + 1}`,
    location_type: pick(['Urban', 'Rural', 'Peri-urban'], rand),
    income_band: pick(['Low', 'Lower Middle', 'Middle', 'High'], rand),
    devices_owned: Math.round(clamp(normal(rand, 2.2, 1.2), 0, 8)),
    internet_hours_week: round(clamp(normal(rand, 18, 14), 0, 90), 1),
    digital_skill_score: Math.round(clamp(normal(rand, 62, 21), 0, 100)),
    used_egov_service: rand() < 0.46,
  })),
  sample('time-use-study', 'Time Use Study', 'Daily hours spent on work, care, commute, leisure, and sleep', categories.social, ['composition', 'survey', 'wellbeing'], 240, (i, rand) => {
    const work = round(clamp(normal(rand, 7.5, 2.6), 0, 14), 1)
    const commute = round(clamp(normal(rand, 1.2, 0.8), 0, 5), 1)
    return {
      diary_id: `TU${i + 1}`,
      day_type: pick(['Weekday', 'Weekend'], rand),
      employment_status: pick(['Full-time', 'Part-time', 'Student', 'Homemaker', 'Retired'], rand),
      work_hours: work,
      care_hours: round(clamp(normal(rand, 2.1, 1.8), 0, 10), 1),
      commute_hours: commute,
      leisure_hours: round(clamp(24 - work - commute - normal(rand, 9, 1.2), 0, 12), 1),
      sleep_hours: round(clamp(normal(rand, 7.2, 1.1), 3.5, 11), 1),
    }
  }),
  sample('highway-toll', 'Highway Toll Traffic', 'Vehicle counts, toll revenue, lane wait, and incident flags', categories.transport, ['time-series', 'traffic-flow', 'revenue'], 260, (i, rand) => {
    const vehicles = Math.round(clamp(normal(rand, 3800, 1200), 400, 9000))
    return {
      plaza_day: i + 1,
      plaza_id: `TP${(i % 12) + 1}`,
      vehicle_mix: pick(['Cars Heavy', 'Trucks Heavy', 'Balanced'], rand),
      vehicles,
      avg_wait_seconds: round(clamp(normal(rand, 55 + vehicles / 120, 22), 5, 260), 1),
      toll_revenue: Math.round(vehicles * clamp(normal(rand, 82, 18), 25, 180)),
      incident_reported: rand() < 0.07,
    }
  }),
  sample('bike-share-trips', 'Bike Share Trips', 'Bike-share rentals by station, duration, weather, and subscriber type', categories.transport, ['mobility', 'seasonality', 'demand'], 320, (i, rand) => {
    const temp = round(clamp(normal(rand, 27, 6), 8, 42), 1)
    return {
      trip_id: `BKSH${i + 1}`,
      start_station: pick(['Central', 'University', 'Market', 'Metro Gate', 'Park'], rand),
      user_type: pick(['Subscriber', 'Casual'], rand),
      hour: Math.floor(rand() * 24),
      temperature_c: temp,
      trip_minutes: round(clamp(normal(rand, 22 - Math.abs(temp - 27) / 2, 11), 2, 95), 1),
      distance_km: round(clamp(normal(rand, 3.8, 2), 0.3, 18), 2),
    }
  }),
  sample('seo-keywords', 'SEO Keywords', 'Keyword impressions, rank position, clicks, and landing page type', categories.web, ['ranking', 'conversion', 'search'], 260, (i, rand) => {
    const position = round(clamp(normal(rand, 18, 12), 1, 80), 1)
    const impressions = Math.round(clamp(Math.exp(normal(rand, 8.2, 1.1)), 20, 90000))
    return {
      keyword_id: `KW${i + 1}`,
      intent: pick(['Informational', 'Commercial', 'Navigational', 'Transactional'], rand),
      landing_page_type: pick(['Blog', 'Product', 'Category', 'Docs'], rand),
      avg_position: position,
      impressions,
      clicks: Math.round(impressions * clamp(0.34 / Math.sqrt(position), 0.002, 0.42)),
      conversions: Math.round(impressions * clamp(0.018 / Math.sqrt(position), 0, 0.06)),
    }
  }),
  sample('email-engagement', 'Email Engagement', 'Email campaign opens, clicks, unsubscribes, and audience segments', categories.web, ['funnel', 'ab-test', 'engagement'], 240, (i, rand) => {
    const sent = Math.round(clamp(normal(rand, 8200, 2500), 800, 22000))
    return {
      campaign_id: `EM${i + 1}`,
      segment: pick(['New Leads', 'Active Users', 'Dormant Users', 'Premium'], rand),
      subject_variant: pick(['A', 'B', 'C'], rand),
      sent,
      open_rate_pct: round(clamp(normal(rand, 28, 8), 3, 68), 1),
      click_rate_pct: round(clamp(normal(rand, 5.2, 2.6), 0.1, 22), 1),
      unsubscribe_rate_pct: round(clamp(normal(rand, 0.45, 0.25), 0, 2.5), 2),
    }
  }),
  sample('api-performance', 'API Performance', 'API endpoint latency, request volume, error rate, and cache hit data', categories.web, ['monitoring', 'latency', 'reliability'], 300, (i, rand) => {
    const requests = Math.round(clamp(normal(rand, 52000, 21000), 1000, 180000))
    return {
      endpoint: pick(['/login', '/search', '/checkout', '/report', '/sync'], rand),
      hour: i % 24,
      requests,
      p95_latency_ms: round(clamp(normal(rand, 320 + requests / 900, 130), 40, 1800), 1),
      error_rate_pct: round(clamp(normal(rand, 0.9 + requests / 90000, 0.55), 0, 8), 2),
      cache_hit_pct: round(clamp(normal(rand, 64, 18), 0, 99), 1),
      deploy_window: rand() < 0.08,
    }
  }),
  sample('soil-nutrients', 'Soil Nutrients', 'Soil nitrogen, phosphorus, potassium, organic carbon, and crop suitability', categories.agriculture, ['multivariate', 'classification', 'soil-health'], 240, (i, rand) => ({
    field_id: `SN${i + 1}`,
    district: pick(['Nashik', 'Guntur', 'Hisar', 'Madurai', 'Kota'], rand),
    soil_texture: pick(['Sandy', 'Loamy', 'Clay', 'Silty'], rand),
    nitrogen_kg_ha: round(clamp(normal(rand, 280, 95), 40, 650), 1),
    phosphorus_kg_ha: round(clamp(normal(rand, 32, 14), 4, 95), 1),
    potassium_kg_ha: round(clamp(normal(rand, 210, 70), 35, 520), 1),
    organic_carbon_pct: round(clamp(normal(rand, 0.72, 0.28), 0.08, 2.2), 2),
    suitable_crop: pick(['Rice', 'Wheat', 'Cotton', 'Pulses', 'Vegetables'], rand),
  })),
  sample('dairy-production', 'Dairy Production', 'Daily milk yield by feed mix, breed, lactation stage, and health checks', categories.agriculture, ['regression', 'animal-health', 'farm-management'], 220, (i, rand) => {
    const feed = round(clamp(normal(rand, 12, 3.2), 3, 24), 1)
    return {
      animal_id: `DY${i + 1}`,
      breed: pick(['Gir', 'Sahiwal', 'HF Cross', 'Jersey Cross'], rand),
      lactation_month: Math.round(clamp(normal(rand, 5, 2.8), 1, 14)),
      feed_kg_day: feed,
      water_liters_day: round(clamp(normal(rand, 58, 16), 18, 120), 1),
      health_score: Math.round(clamp(normal(rand, 82, 10), 35, 100)),
      milk_liters_day: round(clamp(2.5 + feed * 1.1 + normal(rand, 0, 3.5), 1, 38), 1),
    }
  }),
  sample('irrigation-efficiency', 'Irrigation Efficiency', 'Irrigation water use, evapotranspiration, crop stage, and yield response', categories.agriculture, ['water-use', 'efficiency', 'regression'], 240, (i, rand) => {
    const water = round(clamp(normal(rand, 38, 14), 5, 95), 1)
    return {
      plot_id: `IR${i + 1}`,
      irrigation_method: pick(['Flood', 'Sprinkler', 'Drip'], rand),
      crop_stage: pick(['Vegetative', 'Flowering', 'Grain Fill', 'Harvest'], rand),
      water_mm_week: water,
      evapotranspiration_mm: round(clamp(normal(rand, 31, 8), 8, 62), 1),
      soil_moisture_pct: round(clamp(normal(rand, 24 + water / 6, 7), 4, 58), 1),
      water_use_efficiency: round(clamp(normal(rand, 1.8 + (water < 45 ? 0.35 : 0), 0.45), 0.4, 4.5), 2),
    }
  }),
  sample('pest-monitoring', 'Pest Monitoring', 'Trap counts, crop stage, pesticide use, and field damage ratings', categories.agriculture, ['counts', 'risk', 'crop-protection'], 220, (i, rand) => {
    const traps = Math.round(clamp(normal(rand, 18, 10), 0, 75))
    return {
      scouting_id: `PM${i + 1}`,
      crop: pick(['Cotton', 'Rice', 'Maize', 'Vegetables'], rand),
      pest_type: pick(['Aphid', 'Borer', 'Whitefly', 'Armyworm'], rand),
      trap_count: traps,
      crop_stage: pick(['Seedling', 'Vegetative', 'Flowering', 'Maturity'], rand),
      pesticide_applied: rand() < clamp(traps / 90, 0.05, 0.82),
      damage_pct: round(clamp(normal(rand, traps * 0.42, 7), 0, 80), 1),
    }
  }),
  sample('inspection-scores', 'Inspection Scores', 'Supplier inspection scorecards, nonconformities, and acceptance decisions', categories.quality, ['supplier-quality', 'classification', 'scorecard'], 220, (i, rand) => {
    const score = Math.round(clamp(normal(rand, 84, 11), 35, 100))
    return {
      inspection_id: `IS${i + 1}`,
      supplier_tier: pick(['Tier 1', 'Tier 2', 'Tier 3'], rand),
      product_family: pick(['Electronics', 'Textiles', 'Machined Parts', 'Packaging'], rand),
      visual_defects: Math.round(clamp(normal(rand, 3, 2.4), 0, 18)),
      dimensional_defects: Math.round(clamp(normal(rand, 1.8, 1.6), 0, 12)),
      audit_score: score,
      accepted: score > 78 && rand() > 0.12,
    }
  }),
  sample('municipal-budget', 'Municipal Budget', 'Department budgets, utilization, project progress, and citizen requests', categories.public, ['budgeting', 'governance', 'performance'], 220, (i, rand) => {
    const budget = round(clamp(normal(rand, 18, 9), 1, 65), 2)
    return {
      project_id: `MB${i + 1}`,
      department: pick(['Roads', 'Water', 'Sanitation', 'Parks', 'Health'], rand),
      ward: `Ward ${Math.floor(rand() * 40) + 1}`,
      budget_crore: budget,
      spend_crore: round(clamp(budget * normal(rand, 0.68, 0.2), 0, budget * 1.15), 2),
      progress_pct: round(clamp(normal(rand, 62, 24), 0, 100), 1),
      citizen_requests: Math.round(clamp(normal(rand, 140, 70), 0, 520)),
    }
  }),
  sample('relief-distribution', 'Relief Distribution', 'Relief camp supplies, households served, stockouts, and delivery delays', categories.public, ['logistics', 'equity', 'emergency-response'], 200, (i, rand) => {
    const households = Math.round(clamp(normal(rand, 260, 95), 35, 720))
    return {
      camp_id: `RD${i + 1}`,
      district: pick(['Coastal', 'Hill', 'River Basin', 'Urban'], rand),
      households_served: households,
      food_kits: Math.round(clamp(normal(rand, households * 1.05, 55), 0, households * 1.6)),
      water_liters: Math.round(clamp(normal(rand, households * 12, 900), 0, households * 26)),
      delivery_delay_hours: round(clamp(normal(rand, 9, 7), 0, 60), 1),
      stockout_reported: rand() < 0.18,
    }
  }),
  sample('rental-market', 'Rental Market', 'Rental listings by neighborhood, area, amenities, and monthly rent', categories.realEstate, ['regression', 'pricing', 'market-analysis'], 260, (i, rand) => {
    const area = Math.round(clamp(normal(rand, 920, 340), 180, 2600))
    const bedrooms = Math.round(clamp(area / 470 + normal(rand, 0, 0.45), 1, 5))
    return {
      listing_id: `RM${i + 1}`,
      neighborhood: pick(['Central', 'Tech Corridor', 'Suburban', 'University', 'Industrial'], rand),
      area_sqft: area,
      bedrooms,
      furnished: rand() < 0.42,
      transit_minutes: Math.round(clamp(normal(rand, 18, 11), 1, 70)),
      monthly_rent: Math.round(clamp(area * 38 + bedrooms * 2200 + normal(rand, 0, 8500), 4000, 180000)),
    }
  }),
  sample('commercial-leasing', 'Commercial Leasing', 'Office lease rates, occupancy, floor plate, and tenant sector data', categories.realEstate, ['commercial', 'pricing', 'occupancy'], 220, (i, rand) => {
    const area = Math.round(clamp(normal(rand, 8400, 4200), 600, 32000))
    return {
      lease_id: `CL${i + 1}`,
      business_district: pick(['CBD', 'IT Park', 'Industrial Estate', 'Suburban Hub'], rand),
      tenant_sector: pick(['IT', 'Finance', 'Retail', 'Healthcare', 'Logistics'], rand),
      floor_area_sqft: area,
      lease_rate_sqft: round(clamp(normal(rand, 94, 35), 18, 260), 2),
      occupancy_pct: round(clamp(normal(rand, 82, 15), 25, 100), 1),
      lease_term_years: Math.round(clamp(normal(rand, 4.2, 2.1), 1, 12)),
    }
  }),
  sample('construction-progress', 'Construction Progress', 'Project milestones, cost variance, labor hours, and delay risk', categories.realEstate, ['project-management', 'risk', 'forecasting'], 240, (i, rand) => {
    const planned = round(clamp(normal(rand, 54, 28), 1, 100), 1)
    const actual = round(clamp(planned + normal(rand, -4, 13), 0, 100), 1)
    return {
      project_id: `CP${i + 1}`,
      project_type: pick(['Apartment', 'Villa', 'Office', 'Retail'], rand),
      phase: pick(['Foundation', 'Structure', 'MEP', 'Finishing', 'Handover'], rand),
      planned_progress_pct: planned,
      actual_progress_pct: actual,
      labor_hours_week: Math.round(clamp(normal(rand, 2200, 850), 250, 6200)),
      cost_variance_pct: round(clamp(normal(rand, (planned - actual) / 3, 6), -18, 36), 1),
      delay_risk: actual + 8 < planned,
    }
  }),
  sample('land-records', 'Land Records', 'Parcel area, zoning, valuation, ownership age, and dispute flags', categories.realEstate, ['categorical', 'valuation', 'governance'], 230, (i, rand) => {
    const area = round(clamp(Math.exp(normal(rand, 8.1, 1.1)), 500, 250000), 1)
    return {
      parcel_id: `LR${i + 1}`,
      zone: pick(['Residential', 'Commercial', 'Agricultural', 'Mixed Use'], rand),
      area_sqft: area,
      road_access: pick(['None', 'Minor Road', 'Main Road', 'Highway'], rand),
      ownership_age_years: round(clamp(normal(rand, 11, 8), 0.2, 65), 1),
      assessed_value_lakhs: round(clamp(area * normal(rand, 0.006, 0.002), 1, 850), 2),
      dispute_flag: rand() < 0.08,
    }
  }),
]
