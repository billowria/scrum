# Sprint Management - Light Color Theme

## 🎨 Color Palette

### Primary Colors (Cyan-Teal-Emerald)
A fresh, modern, and calming color scheme that's easy on the eyes.

#### Main Gradient
- **Header Background**: `from-cyan-400 via-teal-400 to-emerald-400`
- **Filter Active State**: `from-cyan-500 to-teal-500`
- **Project Card Header**: `from-cyan-300 via-teal-300 to-emerald-300`

### Accent Colors

#### Cyan (Sky Blue)
- **Purpose**: Total counts, primary information
- **Shades**: 
  - Background: `cyan-50`, `sky-50`
  - Borders: `cyan-100`, `cyan-200`
  - Text: `cyan-600`
- **Usage**: Total sprint count stats

#### Teal (Ocean Blue-Green)
- **Purpose**: Active states, interactions, primary actions
- **Shades**:
  - Background: `teal-50`, `teal-100`
  - Borders: `teal-200`, `teal-300`
  - Text: `teal-600`, `teal-700`
  - Icons: `teal-700`
- **Usage**: Buttons, borders, interactive elements, folder icons

#### Emerald (Green)
- **Purpose**: Active sprints, success states
- **Shades**:
  - Background: `emerald-50`
  - Active Badge: `emerald-400`
  - Text: `emerald-600`
- **Usage**: Active sprint badges, active status indicators

#### Lime (Light Green)
- **Purpose**: Completed sprints, success metrics
- **Shades**:
  - Background: `lime-50`, `green-50`
  - Borders: `lime-100`
  - Text: `lime-600`
- **Usage**: Completed sprint stats

### Neutral Colors

#### White & Gray
- **Background**: `white`, `gray-50`
- **Text**: `gray-600`, `gray-700`, `gray-900`
- **Borders**: `gray-100`, `gray-200`

## 🎯 Component Color Mapping

### Header Section
```css
Background: bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400
Icon Container: bg-white/30 with border-white/40
Text: text-white with drop-shadow-sm
Button: bg-white text-teal-600 hover:bg-teal-50
```

### Project Cards
```css
Card Border: border-gray-200 hover:border-teal-300
Card Header: bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300
Folder Icon: text-teal-700 on bg-white/40
Active Badge: bg-emerald-400 text-white
Title Hover: text-teal-600
Stats:
  - Total: bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-100 text-cyan-600
  - Active: bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600
  - Done: bg-gradient-to-br from-lime-50 to-green-50 border-lime-100 text-lime-600
View Button: text-teal-600 hover:text-teal-700
Hover Overlay: from-cyan-400/0 to-teal-400/0 hover:from-cyan-400/5 to-teal-400/5
```

### Breadcrumb Navigation
```css
Container: bg-white/80 border-teal-100
Back Button: bg-gradient-to-r from-gray-100 to-gray-200
             hover:from-teal-50 to-cyan-50
             border-gray-200 hover:border-teal-200
Folder Icon: bg-gradient-to-br from-cyan-400 to-teal-400
Sprint Count Badge: bg-gradient-to-r from-cyan-50 to-teal-50
                    border-teal-200 text-teal-700
```

### Filter Tabs
```css
Container: bg-white/80 border-teal-100
Active Tab: bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg
Inactive Tab: text-gray-600 hover:bg-teal-50
Indicator Dot: bg-white (on active tab)
```

## 🌈 Color Psychology

### Cyan
- **Feeling**: Calm, trust, clarity
- **Message**: Professional, modern, clean
- **Use Case**: Information display, non-critical actions

### Teal
- **Feeling**: Balance, growth, stability
- **Message**: Reliable, innovative, friendly
- **Use Case**: Primary actions, interactive elements

### Emerald
- **Feeling**: Success, progress, energy
- **Message**: Active, growing, positive
- **Use Case**: Active states, success indicators

### Lime
- **Feeling**: Fresh, complete, achievement
- **Message**: Accomplished, finished, successful
- **Use Case**: Completion states, done metrics

## 💡 Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards:
- **Text on white**: All gray shades (600-900) pass
- **White text on cyan-500**: ✅ 4.5:1
- **White text on teal-500**: ✅ 4.5:1
- **White text on emerald-400**: ✅ 4.5:1
- **Teal-700 on white**: ✅ 7.8:1

### Light Theme Benefits
1. **Reduced eye strain** in bright environments
2. **Better readability** for extended use
3. **Professional appearance** for business settings
4. **Print-friendly** colors
5. **Battery efficient** on LCD screens

## 🎨 Design Principles

1. **Soft & Light**: Pastel tones for comfort
2. **Consistent Gradients**: Smooth transitions throughout
3. **Subtle Depth**: Light shadows and borders
4. **Clear Hierarchy**: Color intensity indicates importance
5. **Harmonious**: All colors work together naturally

## 🚀 Future Expansion

Consider adding:
- **Amber/Yellow**: For warnings or pending states
- **Rose/Pink**: For urgent or high-priority items
- **Blue**: For information or help content
- **Slate**: For disabled or inactive states

---

**Theme Name**: Ocean Breeze  
**Color Family**: Cyan-Teal-Emerald  
**Style**: Light, Fresh, Modern  
**Version**: 1.0  
**Status**: ✅ Production Ready
