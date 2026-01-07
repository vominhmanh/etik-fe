# Font Setup Instructions

## Copy Fonts to Public Folder

Để sử dụng fonts Shuttleblock trong component này, bạn cần copy fonts từ `src/fonts/pubg-gala-2025/BODY/` vào `public/fonts/pubg-gala-2025/BODY/`.

### Cấu trúc thư mục cần tạo:

```
public/
  fonts/
    pubg-gala-2025/
      BODY/
        [tất cả các file .otf fonts]
```

### Các font families có sẵn:

1. **Shuttleblock** - Regular/Standard variant
   - Medium (500), Demi (600), Bold (700)
   - Có italic cho mỗi weight

2. **Shuttleblock-Narrow** - Narrow variant
   - Medium (500), Demi (600), Bold (700)
   - Có italic cho mỗi weight

3. **Shuttleblock-Condensed** - Condensed variant
   - Medium (500), Demi (600), Bold (700)
   - Có italic cho mỗi weight

4. **Shuttleblock-Wide** - Wide variant
   - Medium (500), Demi (600), Bold (700)
   - Có italic cho mỗi weight

### Cách sử dụng trong component:

```tsx
style={{
  fontFamily: 'Shuttleblock, sans-serif', // Regular
  // hoặc
  fontFamily: 'Shuttleblock-Narrow, sans-serif', // Narrow
  // hoặc
  fontFamily: 'Shuttleblock-Condensed, sans-serif', // Condensed
  // hoặc
  fontFamily: 'Shuttleblock-Wide, sans-serif', // Wide
  fontWeight: 700, // 500, 600, hoặc 700
  fontStyle: 'italic', // hoặc 'normal'
}}
```

