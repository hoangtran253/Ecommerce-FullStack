const getInitials = (name) => {
  const source = (name || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const UserAvatar = ({ src, name, size = 40, className = "" }) => {
  const px = typeof size === "number" ? size : 40;
  const style = { width: px, height: px, minWidth: px, minHeight: px };

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Khách hàng"}
        className={`rounded-full object-cover border border-gray-200 ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center font-semibold text-sm ${className}`}
      style={style}
    >
      {getInitials(name)}
    </div>
  );
};

export default UserAvatar;
