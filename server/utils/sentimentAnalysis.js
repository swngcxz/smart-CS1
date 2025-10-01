// Sentiment Analysis and Feedback Categorization Utility

// Positive keywords for compliments
const positiveKeywords = [
  'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'outstanding', 'perfect',
  'love', 'awesome', 'brilliant', 'superb', 'marvelous', 'impressive', 'satisfied',
  'happy', 'pleased', 'delighted', 'thrilled', 'ecstatic', 'grateful', 'thankful',
  'recommend', 'highly recommend', 'best', 'top', 'exceeded expectations', 'beyond expectations',
  'helpful', 'useful', 'effective', 'efficient', 'reliable', 'professional', 'quality',
  'innovative', 'modern', 'advanced', 'cutting-edge', 'user-friendly', 'easy to use',
  'fast', 'quick', 'responsive', 'smooth', 'seamless', 'convenient', 'accessible'
];

// Negative keywords for complaints
const negativeKeywords = [
  'terrible', 'awful', 'horrible', 'disgusting', 'disappointed', 'frustrated', 'angry',
  'annoyed', 'upset', 'dissatisfied', 'unhappy', 'poor', 'bad', 'worst', 'hate',
  'dislike', 'useless', 'waste', 'rubbish', 'garbage', 'trash', 'broken', 'faulty',
  'defective', 'malfunctioning', 'slow', 'laggy', 'unresponsive', 'difficult', 'hard',
  'complicated', 'confusing', 'unclear', 'misleading', 'deceptive', 'unreliable',
  'unprofessional', 'incompetent', 'inadequate', 'insufficient', 'lacking', 'missing',
  'error', 'bug', 'issue', 'problem', 'trouble', 'concern', 'complaint', 'criticism'
];

// Suggestion keywords
const suggestionKeywords = [
  'suggest', 'recommend', 'propose', 'advise', 'think', 'believe', 'consider',
  'should', 'could', 'would', 'might', 'perhaps', 'maybe', 'possibly',
  'improve', 'enhance', 'upgrade', 'better', 'optimize', 'refine', 'modify',
  'add', 'include', 'implement', 'develop', 'create', 'build', 'design',
  'feature', 'functionality', 'capability', 'option', 'choice', 'alternative',
  'instead', 'rather', 'prefer', 'wish', 'hope', 'want', 'need', 'require',
  'expect', 'anticipate', 'look forward', 'future', 'next', 'coming'
];

// Neutral keywords
const neutralKeywords = [
  'okay', 'ok', 'fine', 'average', 'normal', 'standard', 'typical', 'regular',
  'acceptable', 'adequate', 'sufficient', 'decent', 'fair', 'moderate',
  'question', 'ask', 'wonder', 'curious', 'inquiry', 'information', 'details',
  'how', 'what', 'when', 'where', 'why', 'who', 'which', 'explain', 'describe'
];

/**
 * Analyze sentiment of feedback text
 * @param {string} text - The feedback text to analyze
 * @returns {Object} - Sentiment analysis result
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', score: 0, confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let suggestionScore = 0;
  let neutralScore = 0;

  // Count keyword matches
  words.forEach(word => {
    if (positiveKeywords.includes(word)) positiveScore++;
    if (negativeKeywords.includes(word)) negativeScore++;
    if (suggestionKeywords.includes(word)) suggestionScore++;
    if (neutralKeywords.includes(word)) neutralScore++;
  });

  // Check for phrases (2-3 word combinations)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
  }
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }

  phrases.forEach(phrase => {
    if (positiveKeywords.includes(phrase)) positiveScore += 2;
    if (negativeKeywords.includes(phrase)) negativeScore += 2;
    if (suggestionKeywords.includes(phrase)) suggestionScore += 2;
  });

  // Calculate total score and determine sentiment
  const totalScore = positiveScore + negativeScore + suggestionScore + neutralScore;
  
  if (totalScore === 0) {
    return { sentiment: 'neutral', score: 0, confidence: 0.5 };
  }

  const maxScore = Math.max(positiveScore, negativeScore, suggestionScore, neutralScore);
  let sentiment = 'neutral';
  let confidence = maxScore / totalScore;

  if (positiveScore > negativeScore && positiveScore > suggestionScore) {
    sentiment = 'positive';
  } else if (negativeScore > positiveScore && negativeScore > suggestionScore) {
    sentiment = 'negative';
  } else if (suggestionScore > positiveScore && suggestionScore > negativeScore) {
    sentiment = 'suggestion';
  }

  return {
    sentiment,
    score: maxScore,
    confidence: Math.min(confidence, 1),
    breakdown: {
      positive: positiveScore,
      negative: negativeScore,
      suggestion: suggestionScore,
      neutral: neutralScore
    }
  };
}

/**
 * Categorize feedback based on sentiment and content
 * @param {string} text - The feedback text
 * @param {number} rating - The star rating (1-5)
 * @returns {Object} - Categorization result
 */
function categorizeFeedback(text, rating) {
  const sentiment = analyzeSentiment(text);
  
  // Determine primary category based on sentiment and rating
  let category = 'general';
  let subcategory = 'general';

  // High rating (4-5 stars) with positive sentiment = compliment
  if (rating >= 4 && sentiment.sentiment === 'positive') {
    category = 'praise';
    subcategory = 'compliment';
  }
  // Low rating (1-2 stars) with negative sentiment = complaint
  else if (rating <= 2 && sentiment.sentiment === 'negative') {
    category = 'complaint';
    subcategory = 'negative_feedback';
  }
  // Suggestion sentiment = suggestion
  else if (sentiment.sentiment === 'suggestion') {
    category = 'feature';
    subcategory = 'suggestion';
  }
  // Medium rating (3 stars) = general feedback
  else if (rating === 3) {
    category = 'general';
    subcategory = 'neutral_feedback';
  }
  // Mixed signals - use sentiment as primary indicator
  else {
    switch (sentiment.sentiment) {
      case 'positive':
        category = 'praise';
        subcategory = 'compliment';
        break;
      case 'negative':
        category = 'complaint';
        subcategory = 'negative_feedback';
        break;
      case 'suggestion':
        category = 'feature';
        subcategory = 'suggestion';
        break;
      default:
        category = 'general';
        subcategory = 'neutral_feedback';
    }
  }

  return {
    category,
    subcategory,
    sentiment: sentiment.sentiment,
    confidence: sentiment.confidence,
    analysis: sentiment
  };
}

/**
 * Extract key topics from feedback
 * @param {string} text - The feedback text
 * @returns {Array} - Array of detected topics
 */
function extractTopics(text) {
  if (!text || typeof text !== 'string') return [];

  const lowerText = text.toLowerCase();
  const topics = [];

  // Topic keywords
  const topicKeywords = {
    'user_interface': ['ui', 'interface', 'design', 'layout', 'appearance', 'look', 'visual'],
    'performance': ['speed', 'fast', 'slow', 'performance', 'loading', 'response', 'lag'],
    'functionality': ['feature', 'function', 'capability', 'tool', 'option', 'setting'],
    'customer_service': ['support', 'service', 'help', 'assistance', 'staff', 'team'],
    'pricing': ['price', 'cost', 'expensive', 'cheap', 'affordable', 'value', 'money'],
    'reliability': ['reliable', 'stable', 'consistent', 'dependable', 'trustworthy'],
    'ease_of_use': ['easy', 'simple', 'user-friendly', 'intuitive', 'convenient'],
    'documentation': ['documentation', 'manual', 'guide', 'instruction', 'help'],
    'integration': ['integrate', 'connect', 'compatible', 'work with', 'sync']
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  });

  return topics;
}

module.exports = {
  analyzeSentiment,
  categorizeFeedback,
  extractTopics
};
