import type {BaseLayoutProps} from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
    nav: {
        title: (
            <>
                <img
                    src="/favicon.svg"
                    alt="Logo"
                    width={24}
                    height={24}
                    style={{
                        verticalAlign: 'middle',
                        marginRight: 10,
                        borderRadius: 6,    // 圆角更圆润
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        objectFit: 'cover',
                        background: '#fff', // 如果 svg 是透明底，可以考虑加白底
                    }}
                />
                凌波小碎步
            </>
        ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
};
