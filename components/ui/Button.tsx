import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ title, variant = 'primary', isLoading, className, ...props }: ButtonProps) {
  // Determine background color based on variant
  let bgClass = 'bg-blue-500';
  if (variant === 'secondary') bgClass = 'bg-slate-500';
  if (variant === 'danger') bgClass = 'bg-red-500';

  return (
    <TouchableOpacity
      className={`w-full h-12 rounded-xl flex-row items-center justify-center px-4 active:opacity-80 ${bgClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white text-base font-bold tracking-wide">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
