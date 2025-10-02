import { motion } from 'framer-motion';

const Button = ({ children, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ 
        rotate: 720, // 2 full rotations
        scale: 1.2,
        transition: {
          duration: 0.6,
          ease: "easeInOut"
        }
      }}
    >
      {children}
    </motion.button>
  );
};

export default Button;

