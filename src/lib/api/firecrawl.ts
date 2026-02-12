import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse = {
  success: boolean;
  error?: string;
  data?: any;
  markdown?: string;
  html?: string;
  [key: string]: any;
};

type ScrapeOptions = {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  location?: { country?: string; languages?: string[] };
};

export const firecrawlApi = {
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
