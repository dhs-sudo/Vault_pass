import { VaultCategory, ServiceDomainCategory, AutoCategoryResult } from '../types/vault';

interface ServiceDefinition {
  brand: string;
  domains: string[];
  keywords: string[];
  category: VaultCategory;
  serviceCategory: ServiceDomainCategory;
  categoryLabel: string;
  tags: string[];
}

const KNOWN_SERVICES: ServiceDefinition[] = [
  // Developer, Cloud & Infrastructure
  {
    brand: 'GitHub',
    domains: ['github.com', 'github.io'],
    keywords: ['github', 'vcs', 'git repository'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Dev', 'VCS', 'Cloud'],
  },
  {
    brand: 'GitLab',
    domains: ['gitlab.com'],
    keywords: ['gitlab'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Dev', 'CI/CD', 'Git'],
  },
  {
    brand: 'Amazon Web Services',
    domains: ['aws.amazon.com', 'console.aws.amazon.com', 'signin.aws.amazon.com'],
    keywords: ['aws', 'amazon web services', 'iam', 'ec2', 's3'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Cloud', 'DevOps', 'AWS'],
  },
  {
    brand: 'Google Cloud Platform',
    domains: ['cloud.google.com', 'console.cloud.google.com', 'accounts.google.com'],
    keywords: ['google cloud', 'gcp', 'gsuite', 'firebase'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Cloud', 'GCP', 'Admin'],
  },
  {
    brand: 'Cloudflare',
    domains: ['cloudflare.com', 'dash.cloudflare.com'],
    keywords: ['cloudflare', 'dns', 'zero trust', 'cdn'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['DNS', 'Security', 'Edge'],
  },
  {
    brand: 'Vercel',
    domains: ['vercel.com', 'vercel.app'],
    keywords: ['vercel', 'nextjs', 'deployment'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Dev', 'Hosting', 'Frontend'],
  },
  {
    brand: 'Supabase',
    domains: ['supabase.com', 'supabase.co'],
    keywords: ['supabase', 'postgres', 'database'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Database', 'Postgres', 'Backend'],
  },
  {
    brand: 'Docker',
    domains: ['docker.com', 'hub.docker.com'],
    keywords: ['docker', 'container', 'registry'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['DevOps', 'Containers'],
  },
  {
    brand: 'DigitalOcean',
    domains: ['digitalocean.com'],
    keywords: ['digitalocean', 'droplet'],
    category: 'login',
    serviceCategory: 'developer',
    categoryLabel: 'Developer & Cloud',
    tags: ['Cloud', 'VPS', 'Hosting'],
  },

  // Finance & Banking
  {
    brand: 'Stripe',
    domains: ['stripe.com', 'dashboard.stripe.com'],
    keywords: ['stripe', 'payments', 'merchant', 'billing'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Finance', 'Stripe', 'Billing'],
  },
  {
    brand: 'PayPal',
    domains: ['paypal.com'],
    keywords: ['paypal'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Finance', 'Payments'],
  },
  {
    brand: 'Wise',
    domains: ['wise.com', 'transferwise.com'],
    keywords: ['wise', 'transferwise', 'exchange'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Finance', 'Banking', 'Forex'],
  },
  {
    brand: 'Revolut',
    domains: ['revolut.com'],
    keywords: ['revolut'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Banking', 'Finance'],
  },
  {
    brand: 'Coinbase',
    domains: ['coinbase.com'],
    keywords: ['coinbase', 'crypto', 'bitcoin', 'ethereum'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Crypto', 'Finance', 'Wallet'],
  },
  {
    brand: 'Chase Bank',
    domains: ['chase.com'],
    keywords: ['chase', 'chase bank', 'jpmorgan'],
    category: 'login',
    serviceCategory: 'finance',
    categoryLabel: 'Finance & Banking',
    tags: ['Banking', 'Finance'],
  },

  // Productivity & Work
  {
    brand: 'Notion',
    domains: ['notion.so', 'notion.site'],
    keywords: ['notion', 'workspace', 'wiki'],
    category: 'login',
    serviceCategory: 'productivity',
    categoryLabel: 'Productivity & Work',
    tags: ['Work', 'Docs', 'Productivity'],
  },
  {
    brand: 'Slack',
    domains: ['slack.com'],
    keywords: ['slack', 'workspace'],
    category: 'login',
    serviceCategory: 'productivity',
    categoryLabel: 'Productivity & Work',
    tags: ['Work', 'Communication', 'Team'],
  },
  {
    brand: 'Figma',
    domains: ['figma.com'],
    keywords: ['figma', 'design', 'figjam'],
    category: 'login',
    serviceCategory: 'productivity',
    categoryLabel: 'Productivity & Work',
    tags: ['Design', 'Work', 'Productivity'],
  },
  {
    brand: 'Linear',
    domains: ['linear.app'],
    keywords: ['linear', 'issue tracking', 'sprint'],
    category: 'login',
    serviceCategory: 'productivity',
    categoryLabel: 'Productivity & Work',
    tags: ['Dev', 'Project', 'Work'],
  },
  {
    brand: 'Jira / Atlassian',
    domains: ['atlassian.net', 'jira.com', 'confluence.com'],
    keywords: ['jira', 'atlassian', 'confluence'],
    category: 'login',
    serviceCategory: 'productivity',
    categoryLabel: 'Productivity & Work',
    tags: ['Work', 'Agile', 'Enterprise'],
  },

  // Social & Communication
  {
    brand: 'Discord',
    domains: ['discord.com', 'discordapp.com'],
    keywords: ['discord', 'guild', 'bot token'],
    category: 'login',
    serviceCategory: 'social',
    categoryLabel: 'Social & Communication',
    tags: ['Social', 'Community', 'Chat'],
  },
  {
    brand: 'Twitter / X',
    domains: ['twitter.com', 'x.com'],
    keywords: ['twitter', 'tweet'],
    category: 'login',
    serviceCategory: 'social',
    categoryLabel: 'Social & Communication',
    tags: ['Social', 'Network'],
  },
  {
    brand: 'LinkedIn',
    domains: ['linkedin.com'],
    keywords: ['linkedin', 'professional network'],
    category: 'login',
    serviceCategory: 'social',
    categoryLabel: 'Social & Communication',
    tags: ['Professional', 'Network'],
  },
  {
    brand: 'Reddit',
    domains: ['reddit.com'],
    keywords: ['reddit', 'subreddit'],
    category: 'login',
    serviceCategory: 'social',
    categoryLabel: 'Social & Communication',
    tags: ['Social', 'Community', 'Forum'],
  },
  {
    brand: 'Telegram',
    domains: ['telegram.org', 'web.telegram.org'],
    keywords: ['telegram', 'tg'],
    category: 'login',
    serviceCategory: 'social',
    categoryLabel: 'Social & Communication',
    tags: ['Social', 'Messaging'],
  },

  // Entertainment & Streaming
  {
    brand: 'Spotify',
    domains: ['spotify.com'],
    keywords: ['spotify', 'music', 'playlist'],
    category: 'login',
    serviceCategory: 'entertainment',
    categoryLabel: 'Entertainment & Media',
    tags: ['Media', 'Music', 'Streaming'],
  },
  {
    brand: 'Netflix',
    domains: ['netflix.com'],
    keywords: ['netflix', 'movies', 'stream'],
    category: 'login',
    serviceCategory: 'entertainment',
    categoryLabel: 'Entertainment & Media',
    tags: ['Media', 'Video', 'Streaming'],
  },
  {
    brand: 'Steam',
    domains: ['steampowered.com', 'steamcommunity.com'],
    keywords: ['steam', 'valve', 'gaming'],
    category: 'login',
    serviceCategory: 'entertainment',
    categoryLabel: 'Entertainment & Media',
    tags: ['Gaming', 'Entertainment'],
  },
  {
    brand: 'YouTube',
    domains: ['youtube.com'],
    keywords: ['youtube'],
    category: 'login',
    serviceCategory: 'entertainment',
    categoryLabel: 'Entertainment & Media',
    tags: ['Media', 'Video'],
  },

  // Shopping & E-Commerce
  {
    brand: 'Amazon',
    domains: ['amazon.com', 'amazon.co.uk', 'amazon.de'],
    keywords: ['amazon prime', 'amazon store'],
    category: 'login',
    serviceCategory: 'shopping',
    categoryLabel: 'Shopping & E-Commerce',
    tags: ['Shopping', 'Retail', 'Orders'],
  },
  {
    brand: 'eBay',
    domains: ['ebay.com', 'ebay.co.uk'],
    keywords: ['ebay'],
    category: 'login',
    serviceCategory: 'shopping',
    categoryLabel: 'Shopping & E-Commerce',
    tags: ['Shopping', 'Auction'],
  },
  {
    brand: 'Shopify',
    domains: ['shopify.com', 'myshopify.com'],
    keywords: ['shopify', 'ecommerce store'],
    category: 'login',
    serviceCategory: 'shopping',
    categoryLabel: 'Shopping & E-Commerce',
    tags: ['Commerce', 'Shopify', 'Retail'],
  },
];

/**
 * Extracts a normalized domain string from a URL
 * e.g. "https://dash.cloudflare.com/login" -> "cloudflare.com"
 */
export function extractCleanDomain(url: string): string {
  if (!url || !url.trim()) return '';

  let cleaned = url.trim().toLowerCase();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    let hostname = parsed.hostname;

    // Remove common prefixes like www.
    hostname = hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    // Fallback if URL constructor fails
    return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase();
  }
}

/**
 * Automatically detects category, service domain, and suggested tags
 * from the website URL and item title.
 */
export function detectAutoCategory(websiteUrl: string, title: string): AutoCategoryResult {
  const domain = extractCleanDomain(websiteUrl);
  const normalizedTitle = (title || '').toLowerCase().trim();
  const normalizedUrl = (websiteUrl || '').toLowerCase().trim();

  // 1. Check for explicit vault item type keywords in Title
  if (
    normalizedTitle.includes('api key') ||
    normalizedTitle.includes('api secret') ||
    normalizedTitle.includes('bearer token') ||
    normalizedTitle.includes('private key')
  ) {
    return {
      category: 'api_key',
      serviceCategory: 'developer',
      categoryLabel: 'API Keys & Secrets',
      suggestedTags: ['API', 'Secret', 'Dev'],
      confidence: 0.95,
    };
  }

  if (
    normalizedTitle.includes('credit card') ||
    normalizedTitle.includes('debit card') ||
    normalizedTitle.includes('visa') ||
    normalizedTitle.includes('mastercard') ||
    normalizedTitle.includes('amex')
  ) {
    return {
      category: 'card',
      serviceCategory: 'finance',
      categoryLabel: 'Payment Cards',
      suggestedTags: ['Finance', 'Card', 'Payments'],
      confidence: 0.95,
    };
  }

  if (
    normalizedTitle.includes('secure note') ||
    normalizedTitle.includes('recovery phrase') ||
    normalizedTitle.includes('seed phrase') ||
    normalizedTitle.includes('ssh key') ||
    normalizedTitle.includes('memo')
  ) {
    return {
      category: 'secure_note',
      serviceCategory: 'general',
      categoryLabel: 'Secure Notes',
      suggestedTags: ['Note', 'Recovery'],
      confidence: 0.95,
    };
  }

  // 2. Exact or Subdomain Match in Known Services
  if (domain) {
    for (const service of KNOWN_SERVICES) {
      if (
        service.domains.some(
          (d) => domain === d || domain.endsWith(`.${d}`) || d.includes(domain)
        )
      ) {
        return {
          category: service.category,
          serviceCategory: service.serviceCategory,
          categoryLabel: service.categoryLabel,
          suggestedTags: service.tags,
          brandName: service.brand,
          confidence: 0.98,
        };
      }
    }
  }

  // 3. Keyword Match in Title or URL
  for (const service of KNOWN_SERVICES) {
    if (
      service.keywords.some((kw) => normalizedTitle.includes(kw) || normalizedUrl.includes(kw))
    ) {
      return {
        category: service.category,
        serviceCategory: service.serviceCategory,
        categoryLabel: service.categoryLabel,
        suggestedTags: service.tags,
        brandName: service.brand,
        confidence: 0.85,
      };
    }
  }

  // 4. Broad Heuristics
  // Developer
  if (
    /git|dev|cloud|infra|server|deploy|api|linux|host|db|database|cluster|admin/i.test(
      `${normalizedTitle} ${domain}`
    )
  ) {
    return {
      category: 'login',
      serviceCategory: 'developer',
      categoryLabel: 'Developer & Cloud',
      suggestedTags: ['Dev', 'Cloud'],
      confidence: 0.75,
    };
  }

  // Finance
  if (
    /bank|pay|finance|crypto|wallet|invest|trading|card|fund|money|account/i.test(
      `${normalizedTitle} ${domain}`
    )
  ) {
    return {
      category: 'login',
      serviceCategory: 'finance',
      categoryLabel: 'Finance & Banking',
      suggestedTags: ['Finance', 'Banking'],
      confidence: 0.75,
    };
  }

  // Social
  if (
    /chat|social|message|community|forum|meet|call|talk|post/i.test(
      `${normalizedTitle} ${domain}`
    )
  ) {
    return {
      category: 'login',
      serviceCategory: 'social',
      categoryLabel: 'Social & Communication',
      suggestedTags: ['Social', 'Community'],
      confidence: 0.75,
    };
  }

  // Shopping
  if (
    /shop|store|buy|cart|order|retail|market|deal/i.test(
      `${normalizedTitle} ${domain}`
    )
  ) {
    return {
      category: 'login',
      serviceCategory: 'shopping',
      categoryLabel: 'Shopping & E-Commerce',
      suggestedTags: ['Shopping', 'Retail'],
      confidence: 0.75,
    };
  }

  // Entertainment
  if (
    /movie|stream|music|game|gaming|video|play|radio|show/i.test(
      `${normalizedTitle} ${domain}`
    )
  ) {
    return {
      category: 'login',
      serviceCategory: 'entertainment',
      categoryLabel: 'Entertainment & Media',
      suggestedTags: ['Entertainment', 'Media'],
      confidence: 0.75,
    };
  }

  // Default fallback
  return {
    category: 'login',
    serviceCategory: 'general',
    categoryLabel: 'Logins & 2FA',
    suggestedTags: ['General'],
    confidence: 0.5,
  };
}

/**
 * Returns human-readable label for a service category
 */
export function getServiceCategoryLabel(cat?: ServiceDomainCategory): string {
  switch (cat) {
    case 'developer':
      return 'Developer & Cloud';
    case 'finance':
      return 'Finance & Banking';
    case 'productivity':
      return 'Productivity & Work';
    case 'social':
      return 'Social & Communication';
    case 'entertainment':
      return 'Entertainment & Media';
    case 'shopping':
      return 'Shopping & E-Commerce';
    case 'general':
    default:
      return 'General Logins';
  }
}
