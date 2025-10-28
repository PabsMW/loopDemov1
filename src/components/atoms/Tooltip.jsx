import { motion } from 'framer-motion';

const Tooltip = ({ text, show, className = '' }) => {
  if (!show || !text) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 1.2 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-sky-950 text-cotton-300 text-sm rounded-lg whitespace-nowrap font-comfortaa z-90 ${className}`}
    >
      {text}
      
      {/* Triangle pointer */}
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-sky-950"
        style={{ marginTop: '-1px' }}
      />
    </motion.div>
  );
};

export default Tooltip;

