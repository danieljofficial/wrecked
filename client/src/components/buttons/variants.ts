const variants = {
  primary: {
    solid: {
      enabled: {
        button:
          "bg-brand-yellow text-brand-black font-semibold font-inter hover:bg-yellow-300",
      },
      disabled: {
        button:
          "bg-brand-yellow text-brand-black font-semibold font-inter cursor-not-allowed",
      },
    },
    outline: {
      enabled: {
        button:
          "border border-brand-yellow text-brand-yellow font-semibold font-inter hover:bg-brand-yellow hover:text-brand-black",
      },
      disabled: {
        button:
          "border border-brand-yellow text-brand-yellow font-semibold font-inter cursor-not-allowed",
      },
    },
    ghost: {
      enabled: {
        button:
          "text-brand-yellow font-semibold font-inter hover:bg-brand-navy",
      },
      disabled: {
        button: "text-brand-yellow font-semibold font-inter cursor-not-allowed",
      },
    },
  },
  secondary: {
    solid: {
      enabled: {
        button:
          "bg-brand-navy text-brand-white font-semibold font-inter hover:bg-opacity-80",
      },
      disabled: {
        button:
          "bg-brand-navy text-brand-white font-semibold font-inter cursor-not-allowed",
      },
    },
    outline: {
      enabled: {
        button:
          "border border-brand-beige text-brand-beige font-semibold font-inter hover:bg-brand-navy",
      },
      disabled: {
        button:
          "border border-brand-beige text-brand-beige font-semibold font-inter cursor-not-allowed",
      },
    },
    ghost: {
      enabled: {
        button: "text-brand-beige font-semibold font-inter hover:bg-brand-navy",
      },
      disabled: {
        button: "text-brand-beige font-semibold font-inter cursor-not-allowed",
      },
    },
  },
  danger: {
    solid: {
      enabled: {
        button:
          "bg-red-600 text-white font-semibold font-inter hover:bg-red-700",
      },
      disabled: {
        button:
          "bg-red-600 text-white font-semibold font-inter cursor-not-allowed",
      },
    },
    outline: {
      enabled: {
        button:
          "border border-red-600 text-red-600 font-semibold font-inter hover:bg-red-600 hover:text-white",
      },
      disabled: {
        button:
          "border border-red-600 text-red-600 font-semibold font-inter cursor-not-allowed",
      },
    },
    ghost: {
      enabled: {
        button: "text-red-600 font-semibold font-inter hover:bg-red-600/10",
      },
      disabled: {
        button: "text-red-600 font-semibold font-inter cursor-not-allowed",
      },
    },
  },
  warning: {
    solid: {
      enabled: {
        button:
          "bg-brand-lavender text-brand-black font-semibold font-inter hover:opacity-90",
      },
      disabled: {
        button:
          "bg-brand-lavender text-brand-black font-semibold font-inter cursor-not-allowed",
      },
    },
    outline: {
      enabled: {
        button:
          "border border-brand-lavender text-brand-lavender font-semibold font-inter hover:bg-brand-lavender hover:text-brand-black",
      },
      disabled: {
        button:
          "border border-brand-lavender text-brand-lavender font-semibold font-inter cursor-not-allowed",
      },
    },
    ghost: {
      enabled: {
        button:
          "text-brand-lavender font-semibold font-inter hover:bg-brand-lavender/10",
      },
      disabled: {
        button:
          "text-brand-lavender font-semibold font-inter cursor-not-allowed",
      },
    },
  },
};

export default variants;
