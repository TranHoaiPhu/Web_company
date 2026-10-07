export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const getStatusBadgeClass = (isActive: boolean, isExpired?: boolean): string => {
  if (isActive && !isExpired) {
    return 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200';
  } else if (!isActive || isExpired) {
    return 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200';
  } else {
    return 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200';
  }
};

export const getStatusDotColor = (isActive: boolean, isExpired?: boolean): string => {
  if (isActive && !isExpired) {
    return 'bg-emerald-600';
  } else if (!isActive || isExpired) {
    return 'bg-amber-600';
  } else {
    return 'bg-slate-600';
  }
};

export const getStatusText = (isActive: boolean, isExpired?: boolean): string => {
  if (isActive && !isExpired) {
    return 'Đang hoạt động';
  } else if (!isActive || isExpired) {
    return 'Không hoạt động';
  } else {
    return 'Chờ xử lý';
  }
};
