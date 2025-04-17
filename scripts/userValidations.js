export const Validations = {
    email: (value) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value);
    },
    
    phone: (value) => {
      const regex = /^[0-9]{8,15}$/;
      return regex.test(value);
    },
    
    password: (value) => {
      // Al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return regex.test(value);
    },
    
    creditCard: (value) => {
      // Validar tarjetas cubanas (16 dígitos)
      const regex = /^[0-9]{16}$/;
      if (!regex.test(value)) return false;
      
      // Validar según bancos cubanos
      const firstFour = value.substring(0, 4);
      const validPrefixes = [
          '9225', '9226', '9235', '9245', '9560', // BANMET
          '9201', '9202', '9203', '9207', // BANDEC
          '9204', '9205', '9206', '9212', '9233', '9237', '9238' // BPA
      ];
      
      return validPrefixes.some(prefix => firstFour.startsWith(prefix));
    },
    
    cvv: (value) => {
      const regex = /^[0-9]{3,4}$/;
      return regex.test(value);
    },
    
    cardExpiry: (value) => {
      const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
      if (!regex.test(value)) return false;
      
      const [month, year] = value.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(year) < currentYear) return false;
      if (parseInt(year) === currentYear && parseInt(month) < currentMonth) return false;
      
      return true;
    },
    
    address: (value) => {
      return value && value.length >= 10;
    },
    
    name: (value) => {
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
      return regex.test(value);
    },
    
    quantity: (value) => {
      return !isNaN(value) && parseInt(value) > 0 && parseInt(value) <= 100;
    },
    
    // Nueva validación para bancos cubanos
    cubanBankCard: (value) => {
      if (!this.creditCard(value)) return false;
      
      const firstFour = value.substring(0, 4);
      const validBanks = {
        'BANMET': ['9225', '9226', '9235', '9245', '9560'],
        'BANDEC': ['9201', '9202', '9203', '9207'],
        'BPA': ['9204', '9205', '9206', '9212', '9233', '9237', '9238']
      };
      
      return Object.values(validBanks).some(bankCodes => 
        bankCodes.some(code => firstFour.startsWith(code))
      );
    }
};