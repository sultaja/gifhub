const THEME_SCRIPT = `(function(){try{var d=document.documentElement,c=d.classList;var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){c.add('dark')}else{c.remove('dark')}}catch(e){}})();`

export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
