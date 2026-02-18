import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const QuickActionCard = ({ icon, title, subtitle, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className={cn(
        "cursor-pointer transition-colors group border-border/50 shadow-sm",
        color
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-start p-4">
        <div className="p-2 bg-background/90 backdrop-blur rounded-xl shadow-sm mb-2.5 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="font-light text-foreground text-sm leading-tight">{title}</span>
        <span className="text-xs text-muted-foreground font-medium opacity-80 mt-0.5">{subtitle}</span>
      </CardContent>
    </Card>
  </motion.div>
);

export default QuickActionCard;
