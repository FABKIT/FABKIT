export function useMath()
{
    const clamp = function (value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
    
    return {clamp}
}