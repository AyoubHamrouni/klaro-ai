import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const messages = [
  'Reading your text carefully...',
  'Identifying key concepts...',
  'Creating a clear summary...',
  'Extracting important terms...',
  'Almost done!',
];

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20">
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Summarizing your text</h3>
            <motion.p
              className="text-muted-foreground"
              key={Math.floor(Date.now() / 3000) % messages.length}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {messages[Math.floor(Date.now() / 3000) % messages.length]}
            </motion.p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
