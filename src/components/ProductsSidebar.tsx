import { Package, ShoppingCart, Sparkles, Flame, Coins, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

import { Headphones, Smartphone, Watch, Speaker } from "lucide-react";

const SUBCATEGORIES = [
  { value: 'Headphones', labelKey: 'categoryHeadphones' as const, icon: Headphones },
  { value: 'mobile_phones', labelKey: 'categoryMobilePhones' as const, icon: Smartphone },
  { value: 'smart_watches', labelKey: 'categorySmartWatches' as const, icon: Watch },
  { value: 'speakers', labelKey: 'categorySpeakers' as const, icon: Speaker },
];

const DISCOUNT_FILTERS = [
  { type: 'in_cart', label: 'In Cart', icon: ShoppingCart },
  { type: 'open_box', label: 'Open Box', icon: Package },
  { type: 'promo', label: 'Promo', icon: Sparkles },
  { type: 'clearance', label: 'Clearance', icon: Flame },
];

const CURRENCY_FILTERS = [
  { value: 'all', label: 'All Currencies' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'CZK', label: 'Kč CZK' },
];

interface ProductsSidebarProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedDiscountTypes: string[];
  toggleDiscountType: (type: string) => void;
  selectedCurrency: 'all' | 'EUR' | 'CZK';
  setSelectedCurrency: (currency: 'all' | 'EUR' | 'CZK') => void;
  productCount?: number;
}

export function ProductsSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedDiscountTypes,
  toggleDiscountType,
  selectedCurrency,
  setSelectedCurrency,
  productCount,
}: ProductsSidebarProps) {
  const { state } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!isCollapsed && (
          <span className="text-sm font-medium text-muted-foreground">
            {t('filters')}
          </span>
        )}
        <SidebarTrigger className={cn(isCollapsed && "mx-auto")} />
      </div>

      <SidebarContent className="py-4">
        {/* Categories Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors">
                {!isCollapsed && (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    {t('categories')}
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
                {isCollapsed && <Package className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "w-full justify-start",
                        selectedCategory === null && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {!isCollapsed && t('allCategories')}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {SUBCATEGORIES.map(({ value, labelKey, icon: Icon }) => (
                    <SidebarMenuItem key={value}>
                      <SidebarMenuButton
                        onClick={() => setSelectedCategory(value)}
                        className={cn(
                          "w-full justify-start",
                          selectedCategory === value && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {!isCollapsed && t(labelKey)}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Discount Types Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors">
                {!isCollapsed && (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('discountType')}
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
                {isCollapsed && <Sparkles className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {DISCOUNT_FILTERS.map(({ type, label, icon: Icon }) => (
                    <SidebarMenuItem key={type}>
                      <SidebarMenuButton
                        onClick={() => toggleDiscountType(type)}
                        className={cn(
                          "w-full justify-start",
                          selectedDiscountTypes.includes(type) && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {!isCollapsed && label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Currency Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors">
                {!isCollapsed && (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Currency
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
                {isCollapsed && <Coins className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                {CURRENCY_FILTERS.map(({ value, label }) => (
                    <SidebarMenuItem key={value}>
                      <SidebarMenuButton
                        onClick={() => setSelectedCurrency(value as 'all' | 'EUR' | 'CZK')}
                        className={cn(
                          "w-full justify-start",
                          selectedCurrency === value && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {!isCollapsed ? label : value}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Product Count */}
        {!isCollapsed && productCount !== undefined && (
          <div className="mt-auto px-4 py-4 border-t border-border/50">
            <Badge variant="secondary" className="w-full justify-center py-2">
              {productCount} product{productCount !== 1 ? 's' : ''} found
            </Badge>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
