
import React from 'react';
import { motion } from 'framer-motion';
import DateUtilitiesExample from '../examples/DateUtilitiesExample';

const DateUtilities = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DateUtilitiesExample />
    </motion.div>
  );
};

export default DateUtilities;
