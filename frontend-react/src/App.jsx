import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-full h-full"
        >
          <div className="container mx-auto py-8 px-4 relative">
            <Outlet />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
