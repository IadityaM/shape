import { uniq } from 'lodash'

export const criteria = [
  {
    name: 'Age',
    group: 'Demographics',
    options: [
      'Silent Generation (born 1928-1945)',
      'Baby Boomer (born 1946-1964)',
      'Gen X (born 1965-1980)',
      'Millennial (born 1981-1996)',
      'Gen Z (born 1995-2001)',
    ],
  },
  {
    name: 'Children',
    group: 'Demographics',
    options: [
      'None',
      'Children Under 12',
      'Children 12-17',
      'Children Over 17',
    ],
  },
  {
    name: 'Country',
    group: 'Demographics',
    options: ['United Kingdom', 'United Stateds'],
  },
  {
    name: 'Education',
    group: 'Demographics',
    options: [
      'High School',
      'Vocational',
      'College or Bachelor’s',
      'Postgraduate or Master’s',
      'Doctorate',
    ],
  },
  {
    name: 'Employment Status',
    group: 'Demographics',
    options: [
      'Employed Full Time Job',
      'Employed Part-time',
      'Seeking Employment',
      'Student',
      'Retired',
    ],
  },
  {
    name: 'Gender',
    group: 'Demographics',
    options: ['Female', 'Male', 'Non-Binary', 'Transexual'],
  },
  {
    name: 'Financial Standing',
    group: 'Demographics',
    options: [
      'Paying the monthly bills is a struggle',
      'Just breaking even',
      'Getting by, but should save more',
      'Living comfortably',
      'Spending freely',
    ],
  },
  {
    name: 'Urban/Rural Dweller',
    group: 'Demographics',
    options: ['Metropolis', 'Urban', 'Suburban', 'Rural'],
  },
  {
    name: 'Early/Late Adopter',
    group: 'Psychographics',
    options: ['Early Adopter', 'Early Majority', 'Late Majority', 'Laggard'],
  },
  {
    name: 'Interest',
    group: 'Psychographics',
    options: [
      'Apps',
      'Athlete',
      'Car Owner',
      'Commuter',
      'Conscious Consumer',
      'Digital Native',
      'Entrepreneur',
      'Fashion',
      'Fast Food',
      'Fitness',
      'Foodie',
      'Frequent Flyer',
      'Gadgets',
      'Gamer',
      'Gardening',
      'Gig Economy',
      'Health Conscious',
      'Health Worker',
      'Home Improvement',
      'Home Owner',
      'Mindfulness/Yoga',
      'Outdoorsy',
      'Pet Owner',
      'Quantified Self',
      'Small Business Owner',
      'Smart Home',
      'Tradesman/woman',
      'Vegetarian',
      'Vegan',
    ],
  },
  {
    name: 'Publications',
    group: 'Psychographics',
    options: [
      'Architectural Digest',
      'Bloomberg Businessweek',
      'Cosmopolitan',
      'Elle',
      'Fast Company',
      'Food Network Magazine',
      'Forbes',
      'Fortune',
      'GQ',
      'Good Housekeeping',
      'InStyle',
      'Marie Claire',
      "Men's Health",
      'National Geographic',
      'People',
      'Popular Mechanics',
      'Popular Science',
      'Rolling Stone',
      'Sports Illustrated',
      'The New Yorker',
      'Time Out',
      'Time',
      'Us Weekly',
      'Vanity Fair',
      'Wired',
      "Women's Health",
    ],
  },
]

const getCriteriaBy = (key, value) =>
  criteria.filter(criterion => criterion[key] === value)

const getCriteriaGroups = () =>
  uniq(criteria.reduce((acc, criterion) => [...acc, criterion.group], []))

export const getCriteriaByGroup = group => getCriteriaBy('group', group)

export const getCriterionByName = name => getCriteriaBy('name', name)[0]

export const groupCriteriaByGroup = () =>
  getCriteriaGroups().reduce(
    (acc, group) => [...acc, [group, getCriteriaByGroup(group)]],
    []
  )
