import sympy as sp
import numpy as np

def parse_and_evaluate_equation(equation_str, x_val, h, grid_offset=4):
    """
    Parses a math equation string, evaluates it around x_val with step h,
    and returns exact derivatives.
    """
    x = sp.Symbol('x')
    
    try:
        expr = sp.sympify(equation_str)
        f_num = sp.lambdify(x, expr, modules=['numpy', 'sympy'])
        
        indices = range(-grid_offset, grid_offset + 1)
        x_grid = [x_val + i * h for i in indices]
        
        f_vals = {}
        for i, xv in zip(indices, x_grid):
            try:
                # Handle possible division by zero or log(0) at grid points safely
                val = f_num(xv)
                f_vals[i] = float(val) * 1.0 # force float, lambdify scalar constant handling
            except Exception:
                f_vals[i] = float('nan')

        f_prime = sp.diff(expr, x)
        f_double_prime = sp.diff(f_prime, x)
        f_triple_prime = sp.diff(f_double_prime, x)
        f_quad_prime = sp.diff(f_triple_prime, x)
        
        exact_vals = {}
        exact_exprs = {}
        for orde, expr_prime in zip([1, 2, 3, 4], [f_prime, f_double_prime, f_triple_prime, f_quad_prime]):
            final_val = float(expr_prime.subs(x, x_val).evalf())
            exact_vals[orde] = final_val
            
            latex_func = sp.latex(expr_prime)
            
            # Formulate the substitution step clearly without fully evaluating floats
            if float(x_val).is_integer():
                subbed_expr = expr_prime.subs(x, int(x_val))
            else:
                subbed_expr = expr_prime.subs(x, sp.UnevaluatedExpr(round(x_val, 6)))
                
            latex_subbed = sp.latex(subbed_expr)
            
            prime_str = "'" * orde
            step_str = (
                rf"f^{{{prime_str}}}(x) &= {latex_func} \\"
                rf"f^{{{prime_str}}}({x_val}) &= {latex_subbed} \\"
                rf"&= {final_val:.6f}"
            )
            exact_exprs[orde] = step_str
        
        return True, f_vals, exact_vals, exact_exprs, x_grid, None
    except Exception as e:
        return False, None, None, None, None, str(e)


def evaluate_table_data(df, target_x, h):
    """
    Evaluate dataframe with columns x and f(x).
    Returns f_vals mapped relative to target_x.
    """
    try:
        if 'x' not in df.columns or 'f(x)' not in df.columns:
            return False, None, 0.0, "Kolom harus bernama 'x' dan 'f(x)'"
        
        x_col = df['x'].astype(float).values
        f_col = df['f(x)'].astype(float).values
        
        f_vals = {}
        for i in range(-4, 5):
            expected_x = target_x + i * h
            # Find index where x is close to expected_x (tolerance 1e-5)
            idx = np.where(np.isclose(x_col, expected_x, atol=1e-5))[0]
            if len(idx) > 0:
                f_vals[i] = float(f_col[idx[0]])
            else:
                f_vals[i] = float('nan')
            
        return True, f_vals, float(h), None
        
    except Exception as e:
        return False, None, 0.0, str(e)
