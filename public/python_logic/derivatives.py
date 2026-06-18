import math

def format_val(v):
    if v is None or math.isnan(v):
        return r"\text{NaN}"
    return f"{v:.6f}"

def format_method_latex(m):
    parts = m.split(' O(')
    if len(parts) == 2:
        return rf"\text{{{parts[0]} }} O({parts[1]}"
    return rf"\text{{{m}}}"

def get_val(f_vals, index):
    if index in f_vals:
        val = f_vals[index]
        if val is not None and not math.isnan(val):
            return float(val)
    return float('nan')

def first_derivative(f_vals, h, method='Selisih Pusat O(h^2)'):
    res = float('nan')
    formula = ""
    subst = ""
    
    if method == 'Selisih Maju O(h)':
        f1, f0 = get_val(f_vals, 1), get_val(f_vals, 0)
        res = (f1 - f0) / h
        formula = r"\frac{f_1 - f_0}{h}"
        subst = rf"\frac{{{format_val(f1)} - {format_val(f0)}}}{{{format_val(h)}}}"
        
    elif method == 'Selisih Mundur O(h)':
        f0, fm1 = get_val(f_vals, 0), get_val(f_vals, -1)
        res = (f0 - fm1) / h
        formula = r"\frac{f_0 - f_{-1}}{h}"
        subst = rf"\frac{{{format_val(f0)} - {format_val(fm1)}}}{{{format_val(h)}}}"
        
    elif method == 'Selisih Pusat O(h^2)':
        f1, fm1 = get_val(f_vals, 1), get_val(f_vals, -1)
        res = (f1 - fm1) / (2 * h)
        formula = r"\frac{f_1 - f_{-1}}{2h}"
        subst = rf"\frac{{{format_val(f1)} - {format_val(fm1)}}}{{2({format_val(h)})}}"
        
    elif method == 'Selisih Maju O(h^2)':
        f0, f1, f2 = get_val(f_vals, 0), get_val(f_vals, 1), get_val(f_vals, 2)
        res = (-3 * f0 + 4 * f1 - f2) / (2 * h)
        formula = r"\frac{-3f_0 + 4f_1 - f_2}{2h}"
        subst = rf"\frac{{-3({format_val(f0)}) + 4({format_val(f1)}) - {format_val(f2)}}}{{2({format_val(h)})}}"
        
    elif method == 'Selisih Pusat O(h^4)':
        f2, f1, fm1, fm2 = get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, -1), get_val(f_vals, -2)
        res = (-f2 + 8 * f1 - 8 * fm1 + fm2) / (12 * h)
        formula = r"\frac{-f_2 + 8f_1 - 8f_{-1} + f_{-2}}{12h}"
        subst = rf"\frac{{-{format_val(f2)} + 8({format_val(f1)}) - 8({format_val(fm1)}) + {format_val(fm2)}}}{{12({format_val(h)})}}"
        
    step = rf"{format_method_latex(method)}: & \quad {formula} \\ & = {subst} \\ & = {format_val(res)}"
    return {"res": res, "step": step}

def second_derivative(f_vals, h, method='Selisih Pusat O(h^2)'):
    res = float('nan')
    formula = ""
    subst = ""
    
    if method == 'Selisih Pusat O(h^2)':
        f1, f0, fm1 = get_val(f_vals, 1), get_val(f_vals, 0), get_val(f_vals, -1)
        res = (f1 - 2 * f0 + fm1) / (h ** 2)
        formula = r"\frac{f_1 - 2f_0 + f_{-1}}{h^2}"
        subst = rf"\frac{{{format_val(f1)} - 2({format_val(f0)}) + {format_val(fm1)}}}{{{format_val(h)}^2}}"
        
    elif method == 'Selisih Mundur O(h)':
        f0, fm1, fm2 = get_val(f_vals, 0), get_val(f_vals, -1), get_val(f_vals, -2)
        res = (f0 - 2 * fm1 + fm2) / (h ** 2)
        formula = r"\frac{f_0 - 2f_{-1} + f_{-2}}{h^2}"
        subst = rf"\frac{{{format_val(f0)} - 2({format_val(fm1)}) + {format_val(fm2)}}}{{{format_val(h)}^2}}"
        
    elif method == 'Selisih Maju O(h)':
        f2, f1, f0 = get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0)
        res = (f2 - 2 * f1 + f0) / (h ** 2)
        formula = r"\frac{f_2 - 2f_1 + f_0}{h^2}"
        subst = rf"\frac{{{format_val(f2)} - 2({format_val(f1)}) + {format_val(f0)}}}{{{format_val(h)}^2}}"
        
    elif method == 'Selisih Maju O(h^2)':
        f3, f2, f1, f0 = get_val(f_vals, 3), get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0)
        res = (-f3 + 4 * f2 - 5 * f1 + 2 * f0) / (h ** 2)
        formula = r"\frac{-f_3 + 4f_2 - 5f_1 + 2f_0}{h^2}"
        subst = rf"\frac{{-{format_val(f3)} + 4({format_val(f2)}) - 5({format_val(f1)}) + 2({format_val(f0)})}}{{{format_val(h)}^2}}"
        
    elif method == 'Selisih Pusat O(h^4)':
        f2, f1, f0, fm1, fm2 = get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0), get_val(f_vals, -1), get_val(f_vals, -2)
        res = (-f2 + 16 * f1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h ** 2)
        formula = r"\frac{-f_2 + 16f_1 - 30f_0 + 16f_{-1} - f_{-2}}{12h^2}"
        subst = rf"\frac{{-{format_val(f2)} + 16({format_val(f1)}) - 30({format_val(f0)}) + 16({format_val(fm1)}) - {format_val(fm2)}}}{{12({format_val(h)}^2)}}"

    step = rf"{format_method_latex(method)}: & \quad {formula} \\ & = {subst} \\ & = {format_val(res)}"
    return {"res": res, "step": step}

def third_derivative(f_vals, h, method='Selisih Pusat O(h^2)'):
    res = float('nan')
    formula = ""
    subst = ""
    
    if method == 'Selisih Maju O(h)':
        f3, f2, f1, f0 = get_val(f_vals, 3), get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0)
        res = (f3 - 3 * f2 + 3 * f1 - f0) / (h ** 3)
        formula = r"\frac{f_3 - 3f_2 + 3f_1 - f_0}{h^3}"
        subst = rf"\frac{{{format_val(f3)} - 3({format_val(f2)}) + 3({format_val(f1)}) - {format_val(f0)}}}{{{format_val(h)}^3}}"
        
    elif method == 'Selisih Pusat O(h^2)':
        f2, f1, fm1, fm2 = get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, -1), get_val(f_vals, -2)
        res = (f2 - 2 * f1 + 2 * fm1 - fm2) / (2 * h ** 3)
        formula = r"\frac{f_2 - 2f_1 + 2f_{-1} - f_{-2}}{2h^3}"
        subst = rf"\frac{{{format_val(f2)} - 2({format_val(f1)}) + 2({format_val(fm1)}) - {format_val(fm2)}}}{{2({format_val(h)}^3)}}"
        
    step = rf"{format_method_latex(method)}: & \quad {formula} \\ & = {subst} \\ & = {format_val(res)}"
    return {"res": res, "step": step}

def fourth_derivative(f_vals, h, method='Selisih Pusat O(h^2)'):
    res = float('nan')
    formula = ""
    subst = ""
    
    if method == 'Selisih Maju O(h)':
        f4, f3, f2, f1, f0 = get_val(f_vals, 4), get_val(f_vals, 3), get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0)
        res = (f4 - 4 * f3 + 6 * f2 - 4 * f1 + f0) / (h ** 4)
        formula = r"\frac{f_4 - 4f_3 + 6f_2 - 4f_1 + f_0}{h^4}"
        subst = rf"\frac{{{format_val(f4)} - 4({format_val(f3)}) + 6({format_val(f2)}) - 4({format_val(f1)}) + {format_val(f0)}}}{{{format_val(h)}^4}}"
        
    elif method == 'Selisih Pusat O(h^2)':
        f2, f1, f0, fm1, fm2 = get_val(f_vals, 2), get_val(f_vals, 1), get_val(f_vals, 0), get_val(f_vals, -1), get_val(f_vals, -2)
        res = (f2 - 4 * f1 + 6 * f0 - 4 * fm1 + fm2) / (h ** 4)
        formula = r"\frac{f_2 - 4f_1 + 6f_0 - 4f_{-1} + f_{-2}}{h^4}"
        subst = rf"\frac{{{format_val(f2)} - 4({format_val(f1)}) + 6({format_val(f0)}) - 4({format_val(fm1)}) + {format_val(fm2)}}}{{{format_val(h)}^4}}"

    step = rf"{format_method_latex(method)}: & \quad {formula} \\ & = {subst} \\ & = {format_val(res)}"
    return {"res": res, "step": step}

def richardson_extrapolation(f_vals, h):
    f1, fm1 = get_val(f_vals, 1), get_val(f_vals, -1)
    Dh = (f1 - fm1) / (2 * h)
    
    f2, fm2 = get_val(f_vals, 2), get_val(f_vals, -2)
    D2h = (f2 - fm2) / (4 * h)
    
    f4, fm4 = get_val(f_vals, 4), get_val(f_vals, -4)
    D4h = (f4 - fm4) / (8 * h)
    
    B1 = Dh + (Dh - D2h) / 3 if not (math.isnan(Dh) or math.isnan(D2h)) else float('nan')
    B2 = D2h + (D2h - D4h) / 3 if not (math.isnan(D2h) or math.isnan(D4h)) else float('nan')
    
    C1 = B1 + (B1 - B2) / 15 if not (math.isnan(B1) or math.isnan(B2)) else float('nan')
    
    return {
        "h": h,
        "Dh": Dh, "D2h": D2h, "D4h": D4h,
        "B1": B1, "B2": B2, "C1": C1
    }
