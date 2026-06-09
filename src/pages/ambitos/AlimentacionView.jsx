import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Gear, Check, Clock, Fire, Copy, Trash, CaretLeft, CaretRight, ForkKnife, Sparkle, Timer, Cookie, SunHorizon, Backpack, Barbell, Moon } from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getMealPlanWeekly, saveMealPlanWeekly,
  getMeals, addMeal, deleteMeal, getDietGoals, saveDietGoals,
  getFoodLibrary, addFoodToLibrary, deleteFoodFromLibrary,
  getRecipes, addRecipe, deleteRecipe,
} from '../../store'
import { BarChart, Bar, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from 'recharts'
import FoodSearchModal from './FoodSearchModal'
import { searchFoods } from '../../data/foodDb'

// ── Recetas Repertorio ───────────────────────────────────────────────────────
const PRESET_RECIPES = [
  // Desayuno
  { name:'Lala 100 Cacao + plátano licuado', cat:'Desayuno', kcal:280, protein:16, carbs:45, fat:5, ingredients:['330ml Lala 100 Cacao','1 plátano mediano (100g)'] },
  { name:'Lala 100 Vainilla + fresas', cat:'Desayuno', kcal:210, protein:16, carbs:25, fat:5, ingredients:['330ml Lala 100 Vainilla','150g fresas enteras'] },
  { name:'Licuado de avena, plátano y leche', cat:'Desayuno', kcal:370, protein:12, carbs:55, fat:10, ingredients:['30g avena cruda','1 plátano mediano','250ml leche entera'] },
  { name:'Café frío con scoop de Whey vainilla', cat:'Desayuno', kcal:120, protein:24, carbs:3, fat:1, ingredients:['1 taza café negro','1 scoop Whey vainilla'] },
  { name:'Smoothie de moras congeladas con agua y proteína', cat:'Desayuno', kcal:170, protein:24, carbs:15, fat:1, ingredients:['1 tz (140g) moras congeladas','1 scoop Whey proteína','agua'] },
  { name:'Leche entera con cacao puro en polvo', cat:'Desayuno', kcal:170, protein:9, carbs:15, fat:9, ingredients:['250ml leche entera','1 cda (15g) cacao en polvo sin azúcar'] },
  { name:'Licuado de amaranto con leche y miel', cat:'Desayuno', kcal:330, protein:13, carbs:45, fat:11, ingredients:['30g amaranto reventado','250ml leche entera','1 cda (15g) miel de abeja'] },
  { name:'Yogurt para beber alto en proteína', cat:'Desayuno', kcal:180, protein:15, carbs:20, fat:3, ingredients:['1 envase (250g) yogurt bebible alto en proteína'] },
  { name:'Café negro + almendras', cat:'Desayuno', kcal:120, protein:4, carbs:4, fat:10, ingredients:['1 taza café negro','20g almendras enteras'] },
  { name:'Batido de proteína de chocolate con crema de cacahuate', cat:'Desayuno', kcal:215, protein:28, carbs:6, fat:9, ingredients:['1 scoop Whey chocolate','1 cda (15g) crema de cacahuate natural','agua'] },
  { name:'Licuado de melón con leche', cat:'Desayuno', kcal:210, protein:9, carbs:25, fat:8, ingredients:['1 tz (160g) melón picado','250ml leche entera'] },
  { name:'Té matcha frío en leche entera', cat:'Desayuno', kcal:150, protein:8, carbs:12, fat:8, ingredients:['1 cdita té matcha en polvo','250ml leche entera','stevia'] },
  { name:'Lala 100 Natural con vainilla', cat:'Desayuno', kcal:160, protein:16, carbs:16, fat:5, ingredients:['330ml Lala 100 Natural','chorrito extracto de vainilla'] },
  { name:'Licuado de papaya y avena', cat:'Desayuno', kcal:320, protein:12, carbs:45, fat:9, ingredients:['1 tz (140g) papaya picada','30g avena cruda','250ml leche entera'] },
  { name:'Smoothie de durazno congelado y yogurt', cat:'Desayuno', kcal:150, protein:16, carbs:20, fat:0, ingredients:['1 tz (150g) durazno congelado','150g yogurt griego sin grasa'] },
  { name:'Café con leche entera y canela', cat:'Desayuno', kcal:155, protein:8, carbs:12, fat:8, ingredients:['1 taza café americano','250ml leche entera','canela en polvo'] },
  { name:'Licuado de manzana con nuez y leche', cat:'Desayuno', kcal:350, protein:11, carbs:38, fat:18, ingredients:['1 manzana mediana (150g)','15g nuez pecana','250ml leche entera'] },
  { name:'Batido Whey con agua de coco', cat:'Desayuno', kcal:180, protein:24, carbs:18, fat:1, ingredients:['1 scoop Whey proteína','330ml agua de coco natural'] },
  { name:'Licuado de mamey con leche', cat:'Desayuno', kcal:300, protein:10, carbs:42, fat:10, ingredients:['1/2 tz (100g) pulpa de mamey','250ml leche entera'] },
  { name:'Leche entera con chocolate en polvo fortificado', cat:'Desayuno', kcal:230, protein:9, carbs:30, fat:9, ingredients:['250ml leche entera','2 cdas (20g) polvo achocolatado comercial'] },
  { name:'Licuado de guayaba con leche (colado)', cat:'Desayuno', kcal:220, protein:10, carbs:28, fat:9, ingredients:['2 guayabas medianas (100g)','250ml leche entera'] },
  { name:'Smoothie de piña con espinaca y proteína', cat:'Desayuno', kcal:200, protein:25, carbs:22, fat:1, ingredients:['1 tz (165g) piña picada','1 tz espinaca fresca','1 scoop Whey proteína'] },
  { name:'Lala 100 Cacao con café soluble (Mocha exprés)', cat:'Desayuno', kcal:190, protein:16, carbs:20, fat:5, ingredients:['330ml Lala 100 Cacao','1 cdita café soluble instantáneo'] },
  { name:'Leche entera con 2 cdas de chía hidratada', cat:'Desayuno', kcal:250, protein:12, carbs:20, fat:15, ingredients:['250ml leche entera','2 cdas (20g) semillas de chía hidratadas'] },
  { name:'Batido de suero de leche con fresas y avena', cat:'Desayuno', kcal:280, protein:28, carbs:35, fat:4, ingredients:['1 scoop Whey proteína','1 tz (150g) fresas','30g avena cruda','agua'] },
  { name:'Jugo verde licuado con scoop de proteína sin sabor', cat:'Desayuno', kcal:170, protein:25, carbs:15, fat:1, ingredients:['1 tz apio/nopal/pepino licuado','1/2 manzana verde','1 scoop Whey sin sabor'] },
  { name:'Licuado de pera con leche y almendras', cat:'Desayuno', kcal:340, protein:12, carbs:40, fat:16, ingredients:['1 pera mediana (150g)','250ml leche entera','15g almendras'] },
  { name:'Café frío con leche evaporada y stevia', cat:'Desayuno', kcal:80, protein:4, carbs:6, fat:4, ingredients:['1 tz café negro','60ml leche evaporada','stevia'] },
  { name:'Batido de agua, crema de maní y cacao', cat:'Desayuno', kcal:210, protein:9, carbs:12, fat:17, ingredients:['2 cdas (30g) crema de cacahuate','1 cda (15g) cacao en polvo','agua'] },
  { name:'Leche de almendras con Whey de chocolate', cat:'Desayuno', kcal:155, protein:25, carbs:5, fat:4, ingredients:['250ml leche de almendras sin azúcar','1 scoop Whey chocolate'] },
  { name:'Licuado de zanahoria, manzana y leche', cat:'Desayuno', kcal:280, protein:9, carbs:42, fat:8, ingredients:['1 zanahoria chica (50g)','1 manzana mediana (150g)','250ml leche entera'] },
  { name:'Smoothie de mango con chile en polvo y proteína', cat:'Desayuno', kcal:220, protein:25, carbs:28, fat:1, ingredients:['1 tz (165g) mango congelado','chile en polvo','1 scoop Whey proteína'] },
  { name:'Lala 100 Vainilla con café instantáneo', cat:'Desayuno', kcal:190, protein:16, carbs:20, fat:5, ingredients:['330ml Lala 100 Vainilla','1 cdita café instantáneo'] },
  { name:'Batido de claras pasteurizadas con chocolate en polvo', cat:'Desayuno', kcal:120, protein:16, carbs:12, fat:0, ingredients:['150ml claras pasteurizadas','1 cda (15g) chocolate en polvo comercial'] },
  { name:'Licuado de plátano, nuez y esencia de vainilla', cat:'Desayuno', kcal:360, protein:11, carbs:42, fat:18, ingredients:['1 plátano mediano','15g nuez pecana','250ml leche entera','chorrito extracto vainilla'] },
  { name:'Leche con galletas Marías licuadas', cat:'Desayuno', kcal:270, protein:10, carbs:38, fat:10, ingredients:['250ml leche entera','5 galletas Marías trituradas'] },
  { name:'Smoothie de frutos rojos y semillas de linaza', cat:'Desayuno', kcal:120, protein:3, carbs:18, fat:5, ingredients:['1 tz (140g) frutos rojos mixtos','1 cda (10g) linaza molida','agua'] },
  { name:'Café frío con scoop de proteína de fresa', cat:'Desayuno', kcal:120, protein:24, carbs:3, fat:1, ingredients:['1 tz café negro frío','1 scoop Whey sabor fresa'] },
  { name:'Licuado de zapote con leche', cat:'Desayuno', kcal:250, protein:9, carbs:35, fat:8, ingredients:['1/2 tz (100g) pulpa de zapote negro','250ml leche entera'] },
  { name:'Batido de agua, avena y Whey protein', cat:'Desayuno', kcal:270, protein:30, carbs:30, fat:4, ingredients:['40g avena cruda','1 scoop Whey proteína','agua'] },
  { name:'Leche de coco con cacao puro', cat:'Desayuno', kcal:90, protein:1, carbs:6, fat:6, ingredients:['250ml leche de coco cartón sin azúcar','1 cda (15g) cacao en polvo'] },
  { name:'Smoothie de plátano congelado con agua y crema de maní', cat:'Desayuno', kcal:195, protein:5, carbs:28, fat:8, ingredients:['1 plátano mediano congelado','1 cda (15g) crema de cacahuate','agua'] },
  { name:'Licuado de ciruela pasa, avena y leche', cat:'Desayuno', kcal:340, protein:12, carbs:55, fat:9, ingredients:['4 ciruelas pasas sin hueso','30g avena cruda','250ml leche entera'] },
  { name:'Lala 100 con 1 cucharada de cajeta', cat:'Desayuno', kcal:220, protein:16, carbs:30, fat:5, ingredients:['330ml Lala 100 Natural','1 cda (15g) cajeta tradicional'] },
  { name:'Café americano con aceite de coco y proteína', cat:'Desayuno', kcal:180, protein:12, carbs:1, fat:14, ingredients:['1 tz café americano','1 cda (15g) aceite de coco','1/2 scoop Whey proteína'] },
  { name:'Licuado de fresas con avena y semillas de girasol', cat:'Desayuno', kcal:220, protein:7, carbs:35, fat:7, ingredients:['1 tz (150g) fresas','30g avena cruda','10g semillas de girasol','agua'] },
  { name:'Batido de manzana cocida, canela y leche', cat:'Desayuno', kcal:240, protein:8, carbs:35, fat:8, ingredients:['1 manzana cocida sin piel (150g)','canela en polvo','250ml leche entera'] },
  { name:'Jugo de naranja licuado con scoop de proteína de vainilla', cat:'Desayuno', kcal:210, protein:25, carbs:24, fat:1, ingredients:['200ml jugo de naranja natural','1 scoop Whey vainilla'] },
  { name:'Leche con polvo de matcha y stevia', cat:'Desayuno', kcal:150, protein:8, carbs:12, fat:8, ingredients:['250ml leche entera','1 cdita matcha en polvo','stevia'] },
  { name:'Licuado de plátano y chocolate amargo', cat:'Desayuno', kcal:310, protein:10, carbs:42, fat:12, ingredients:['1 plátano mediano','10g chocolate amargo 70%','250ml leche entera'] },
  // Colación
  { name:'Yogurt griego natural con nueces picadas', cat:'Colación', kcal:185, protein:17, carbs:8, fat:10, ingredients:['150g yogurt griego natural sin grasa','15g nueces picadas'] },
  { name:'Sándwich de jamón de pavo y queso panela', cat:'Colación', kcal:250, protein:15, carbs:25, fat:8, ingredients:['2 rebanadas pan integral','2 reb jamón de pavo','30g queso panela'] },
  { name:'4 Salmas con queso cottage', cat:'Colación', kcal:160, protein:13, carbs:18, fat:3, ingredients:['4 galletas Salmas','100g queso cottage'] },
  { name:'Manzana picada con crema de cacahuate', cat:'Colación', kcal:190, protein:5, carbs:28, fat:8, ingredients:['1 manzana mediana (150g)','1 cda (15g) crema de cacahuate'] },
  { name:'2 Huevos duros con salsa Valentina o Tajín', cat:'Colación', kcal:140, protein:12, carbs:1, fat:10, ingredients:['2 huevos enteros duros','salsa Valentina o Tajín al gusto'] },
  { name:'Rollitos de pechuga de pavo con espinaca', cat:'Colación', kcal:120, protein:16, carbs:4, fat:4, ingredients:['4 rebanadas jamón de pavo','hojas de espinaca fresca al centro'] },
  { name:'Overnight oats con chía', cat:'Colación', kcal:230, protein:9, carbs:35, fat:6, ingredients:['40g avena cruda','10g semillas de chía','100ml leche entera'] },
  { name:'Plátano con almendras', cat:'Colación', kcal:195, protein:4, carbs:30, fat:8, ingredients:['1 plátano mediano (100g)','15g almendras enteras'] },
  { name:'Tostadas horneadas con atún en agua', cat:'Colación', kcal:190, protein:22, carbs:22, fat:1, ingredients:['2 tostadas horneadas Sanísimo','1 lata atún en agua escurrido'] },
  { name:'Yogurt bebible con uvas', cat:'Colación', kcal:240, protein:15, carbs:35, fat:3, ingredients:['1 envase (250g) yogurt bebible proteína','1 tz (150g) uvas verdes'] },
  { name:'Queso panela en cubos con jitomate cherry', cat:'Colación', kcal:210, protein:15, carbs:6, fat:14, ingredients:['80g queso panela en cubos','1 tz (150g) jitomate cherry'] },
  { name:'Galletas de arroz con crema de maní', cat:'Colación', kcal:165, protein:5, carbs:18, fat:8, ingredients:['2 galletas de arroz inflado natural','1 cda (15g) crema de cacahuate'] },
  { name:'Mix de frutos secos (cacahuates, pasas, semillas)', cat:'Colación', kcal:180, protein:6, carbs:9, fat:15, ingredients:['30g mezcla (cacahuates, pasas, almendras)'] },
  { name:'Sándwich de crema de maní y mermelada', cat:'Colación', kcal:310, protein:11, carbs:42, fat:10, ingredients:['2 rebanadas pan integral','1 cda crema de cacahuate','1 cda mermelada de fresa'] },
  { name:'Pepino y jícama con Tajín + 1 huevo duro', cat:'Colación', kcal:95, protein:7, carbs:8, fat:5, ingredients:['1 tz pepino en cubos','1 huevo entero duro','Tajín al gusto'] },
  { name:'Tortitas de arroz con aguacate', cat:'Colación', kcal:120, protein:2, carbs:18, fat:5, ingredients:['2 galletas de arroz inflado','30g aguacate machacado'] },
  { name:'Yogurt griego con fresas picadas y avena', cat:'Colación', kcal:170, protein:17, carbs:20, fat:2, ingredients:['150g yogurt griego natural','1/2 tz (75g) fresas picadas','15g avena cruda'] },
  { name:'Rollos de jamón con queso oaxaca', cat:'Colación', kcal:180, protein:18, carbs:2, fat:10, ingredients:['3 rebanadas jamón de pavo','30g queso oaxaca deshebrado'] },
  { name:'Tostadas con frijoles machacados y queso fresco', cat:'Colación', kcal:210, protein:10, carbs:30, fat:5, ingredients:['2 tostadas horneadas','1/3 tz (80g) frijoles machacados','20g queso fresco'] },
  { name:'Galletas habaneras con atún y mayonesa light', cat:'Colación', kcal:160, protein:13, carbs:15, fat:5, ingredients:['4 galletas habaneras clásicas','1/2 lata atún en agua','1 cdita mayonesa light'] },
  { name:'Licuado de proteína en shaker', cat:'Colación', kcal:120, protein:24, carbs:3, fat:1, ingredients:['1 scoop Whey proteína','300ml agua'] },
  { name:'Barras de avena y proteína caseras', cat:'Colación', kcal:200, protein:12, carbs:25, fat:6, ingredients:['1 barra casera (50g) avena, miel, crema de maní'] },
  { name:'Ensalada rápida de atún con verduras de lata', cat:'Colación', kcal:150, protein:21, carbs:10, fat:1, ingredients:['1 lata atún en agua','1/2 tz (60g) verduras campesina de lata'] },
  { name:'Rebanadas de pavo envueltas en pepino', cat:'Colación', kcal:100, protein:12, carbs:4, fat:3, ingredients:['3 rebanadas pechuga de pavo','100g pepino en bastones'] },
  { name:'Queso cottage dulce con durazno', cat:'Colación', kcal:130, protein:12, carbs:12, fat:3, ingredients:['100g queso cottage','1/2 tz (75g) durazno natural en cubos'] },
  { name:'Avena hervida con canela y manzana', cat:'Colación', kcal:170, protein:5, carbs:32, fat:2, ingredients:['30g avena hervida en agua','1/2 manzana picada','canela al gusto'] },
  { name:'Sándwich de pollo desmenuzado', cat:'Colación', kcal:180, protein:15, carbs:15, fat:4, ingredients:['1 rebanada pan integral','50g pechuga de pollo deshebrada'] },
  { name:'Gelatina de agua + cacahuates tostados', cat:'Colación', kcal:95, protein:6, carbs:6, fat:7, ingredients:['1 tz gelatina de agua sin azúcar','15g cacahuates tostados'] },
  { name:'Pan integral con hummus de garbanzo', cat:'Colación', kcal:140, protein:6, carbs:18, fat:5, ingredients:['1 rebanada pan integral','2 cdas (30g) hummus de garbanzo'] },
  { name:'2 Mandarinas y almendras', cat:'Colación', kcal:180, protein:4, carbs:24, fat:8, ingredients:['2 mandarinas chicas (150g)','15g almendras'] },
  { name:'Tostada con aguacate y huevo duro', cat:'Colación', kcal:165, protein:8, carbs:12, fat:10, ingredients:['1 tostada horneada','30g aguacate','1 huevo duro en rodajas'] },
  { name:'Yogurt natural con amaranto', cat:'Colación', kcal:140, protein:7, carbs:18, fat:4, ingredients:['150g yogurt natural sin azúcar','15g amaranto natural'] },
  { name:'Salchichas de pavo con limón y chile', cat:'Colación', kcal:120, protein:10, carbs:4, fat:8, ingredients:['2 salchichas de pavo','jugo de limón','Tajín al gusto'] },
  { name:'Sincronizada fría de harina integral con frijol y queso', cat:'Colación', kcal:180, protein:8, carbs:22, fat:6, ingredients:['1 tortilla harina integral pequeña','2 cdas frijol','20g queso panela'] },
  { name:'Mix de semillas de calabaza y girasol', cat:'Colación', kcal:170, protein:8, carbs:6, fat:14, ingredients:['15g pepitas de calabaza','15g semillas de girasol peladas'] },
  { name:'Queso oaxaca deshebrado con galletas saladas', cat:'Colación', kcal:210, protein:13, carbs:14, fat:11, ingredients:['50g queso oaxaca deshebrado','4 galletas saladas tipo Saladitas'] },
  { name:'Manzana cocida con canela y nuez en tupper', cat:'Colación', kcal:160, protein:2, carbs:26, fat:7, ingredients:['1 manzana horneada','10g nuez picada','canela al gusto'] },
  { name:'Sándwich de ensalada de atún', cat:'Colación', kcal:270, protein:18, carbs:30, fat:6, ingredients:['2 rebanadas pan integral','1/2 lata atún en agua','1 cda mayonesa light'] },
  { name:'Pan tostado con requesón', cat:'Colación', kcal:130, protein:11, carbs:14, fat:3, ingredients:['1 rebanada pan tostado integral','50g requesón magro'] },
  { name:'Queso manchego y uvas', cat:'Colación', kcal:210, protein:9, carbs:12, fat:13, ingredients:['40g queso manchego en cubos','1/2 tz (75g) uvas verdes'] },
  { name:'4 Salmas con guacamole y pico de gallo', cat:'Colación', kcal:130, protein:3, carbs:18, fat:5, ingredients:['4 Salmas','30g aguacate machacado','tomate y cebolla (pico de gallo)'] },
  { name:'Yogurt griego con miel', cat:'Colación', kcal:120, protein:15, carbs:14, fat:0, ingredients:['150g yogurt griego natural sin grasa','1 cdita (5g) miel de abeja'] },
  { name:'Tiras de apio y zanahoria con crema de cacahuate', cat:'Colación', kcal:130, protein:4, carbs:12, fat:8, ingredients:['1 tz (120g) bastones de zanahoria y apio','1 cda crema de cacahuate'] },
  { name:'Pan tostado con puré de plátano y chía', cat:'Colación', kcal:155, protein:5, carbs:28, fat:3, ingredients:['1 rebanada pan tostado','1/2 plátano machacado','5g chía espolvoreada'] },
  { name:'2 Huevos duros picados con mostaza sobre galletas', cat:'Colación', kcal:210, protein:14, carbs:15, fat:10, ingredients:['2 huevos duros picados','1 cdita mostaza','4 galletas Salmas'] },
  { name:'Garbanzos tostados caseros', cat:'Colación', kcal:180, protein:9, carbs:30, fat:3, ingredients:['50g garbanzos cocidos tostados al horno','pimentón al gusto'] },
  { name:'Atún en sobre listo para comer', cat:'Colación', kcal:80, protein:16, carbs:0, fat:1, ingredients:['1 sobre (70g) atún en agua'] },
  { name:'Omelette frío con espinaca en tupper', cat:'Colación', kcal:145, protein:13, carbs:2, fat:10, ingredients:['2 huevos enteros batidos y cocidos','puñado de espinaca fresca'] },
  { name:'Galletas de avena sin azúcar', cat:'Colación', kcal:150, protein:4, carbs:20, fat:6, ingredients:['1 porción (30g) galletas avena sin azúcar'] },
  { name:'Barra de proteína', cat:'Colación', kcal:190, protein:15, carbs:20, fat:6, ingredients:['1 barra de proteína de supermercado (~40g)'] },
  // Comida
  { name:'Pechuga de pollo a la plancha con arroz y frijoles', cat:'Comida', kcal:550, protein:55, carbs:65, fat:6, ingredients:['150g pechuga de pollo a la plancha','1 tz (150g) arroz cocido','1/2 tz (120g) frijoles cocidos'] },
  { name:'Carne molida de res con papa en cubos y tortillas', cat:'Comida', kcal:590, protein:38, carbs:58, fat:20, ingredients:['150g carne molida de res magra','150g papa cocida en cubos','3 tortillas de maíz'] },
  { name:'Fajitas de cerdo con pimientos y tortillas', cat:'Comida', kcal:490, protein:35, carbs:48, fat:15, ingredients:['150g lomo de cerdo en tiras','1 tz pimientos y cebolla asados','3 tortillas de maíz'] },
  { name:'Atún guisado a la mexicana con tostadas horneadas', cat:'Comida', kcal:410, protein:42, carbs:46, fat:4, ingredients:['2 latas atún en agua guisado con jitomate y cebolla','4 tostadas horneadas Sanísimo'] },
  { name:'Pasta integral con pechuga y salsa de tomate', cat:'Comida', kcal:560, protein:45, carbs:70, fat:8, ingredients:['1.5 tz (200g) pasta integral cocida','120g pechuga de pollo en trozos','50g puré de tomate'] },
  { name:'Lentejas guisadas con salchicha de pavo y huevo duro', cat:'Comida', kcal:440, protein:30, carbs:42, fat:16, ingredients:['1 tz (200g) lentejas cocidas','2 salchichas de pavo picadas','1 huevo duro'] },
  { name:'Bistec de res encebollado con arroz', cat:'Comida', kcal:520, protein:38, carbs:48, fat:18, ingredients:['150g bistec de res','cebolla asada al gusto','1 tz (150g) arroz cocido'] },
  { name:'Milanesa de pollo a la plancha con puré de papa', cat:'Comida', kcal:510, protein:50, carbs:45, fat:12, ingredients:['150g pollo a la plancha (milanesa)','1 tz (200g) puré de papa casero'] },
  { name:'Tacos de soya texturizada al pastor', cat:'Comida', kcal:450, protein:30, carbs:70, fat:4, ingredients:['50g soya texturizada (en seco) hidratada y guisada','4 tortillas de maíz'] },
  { name:'Ensalada de garbanzos con pollo desmenuzado', cat:'Comida', kcal:450, protein:40, carbs:48, fat:10, ingredients:['1 tz (160g) garbanzos cocidos','100g pechuga deshebrada','lechuga y verdura al gusto'] },
  { name:'Tortitas de atún con avena y arroz', cat:'Comida', kcal:520, protein:48, carbs:50, fat:10, ingredients:['2 latas atún escurridas mezcladas con 30g avena (tortitas)','1/2 tz (75g) arroz de guarnición'] },
  { name:'Pierna de cerdo magra en salsa verde con frijoles', cat:'Comida', kcal:500, protein:40, carbs:45, fat:15, ingredients:['150g pierna de cerdo magra asada','salsa verde natural','1 tz (240g) frijoles de olla'] },
  { name:'Salpicón de res con tostadas', cat:'Comida', kcal:420, protein:30, carbs:40, fat:12, ingredients:['120g falda de res cocida deshebrada','jitomate, cebolla, lechuga crudos','3 tostadas horneadas'] },
  { name:'Pollo deshebrado con mole comercial y arroz', cat:'Comida', kcal:580, protein:40, carbs:60, fat:18, ingredients:['120g pollo deshebrado','30g pasta de mole comercial (Doña María)','1 tz (150g) arroz cocido'] },
  { name:'Arroz frito casero con huevo, chícharos, zanahoria y pollo', cat:'Comida', kcal:510, protein:38, carbs:55, fat:14, ingredients:['1 tz (150g) arroz cocido salteado','1 huevo entero','100g pollo en trozos','50g chícharos y zanahoria'] },
  { name:'Huevos ahogados en salsa roja con frijoles de olla', cat:'Comida', kcal:420, protein:28, carbs:42, fat:16, ingredients:['3 huevos escalfados en salsa de tomate rojo','1 tz (240g) frijoles de olla'] },
  { name:'Tinga de pollo con tostadas', cat:'Comida', kcal:450, protein:45, carbs:40, fat:10, ingredients:['150g pechuga deshebrada guisada con cebolla y chipotle','3 tostadas horneadas'] },
  { name:'Picadillo de res con zanahoria y papa', cat:'Comida', kcal:480, protein:30, carbs:45, fat:18, ingredients:['120g res molida magra guisada','100g papa y zanahoria en cubos','2 tortillas de maíz'] },
  { name:'Chuletas de cerdo ahumadas con ensalada fresca', cat:'Comida', kcal:530, protein:35, carbs:30, fat:28, ingredients:['2 chuletas de cerdo ahumadas (~120g carne)','ensalada de lechuga','1/2 tz (75g) arroz'] },
  { name:'Espagueti con atún de lata y crema', cat:'Comida', kcal:490, protein:30, carbs:65, fat:12, ingredients:['1.5 tz (200g) espagueti cocido','1 lata atún en agua','2 cdas crema light comercial'] },
  { name:'Pechuga empanizada en freidora de aire con camote', cat:'Comida', kcal:540, protein:45, carbs:60, fat:10, ingredients:['150g pechuga empanizada en freidora de aire (15g pan molido)','1 tz (130g) camote cocido'] },
  { name:'Albóndigas de carne molida con caldillo y arroz', cat:'Comida', kcal:600, protein:38, carbs:55, fat:22, ingredients:['150g res molida magra en albóndigas','caldo de tomate natural','1 tz (150g) arroz cocido'] },
  { name:'Tacos de bistec caseros', cat:'Comida', kcal:480, protein:35, carbs:45, fat:16, ingredients:['150g bistec de res asado picado','3 tortillas de maíz','cilantro y cebolla'] },
  { name:'Soya texturizada a la boloñesa con pasta', cat:'Comida', kcal:510, protein:32, carbs:80, fat:4, ingredients:['50g soya texturizada guisada con puré de tomate','1.5 tz (200g) pasta cocida'] },
  { name:'Chilaquiles con pollo y crema (totopos horneados)', cat:'Comida', kcal:460, protein:40, carbs:45, fat:12, ingredients:['40g totopos horneados Sanísimo','120g pollo deshebrado','salsa verde','2 cdas crema light'] },
  { name:'Tilapia a la plancha con verduras al vapor', cat:'Comida', kcal:450, protein:45, carbs:50, fat:6, ingredients:['200g filete de tilapia a la plancha','1 tz brócoli al vapor','1 tz (150g) arroz cocido'] },
  { name:'Hamburguesa casera de res magra', cat:'Comida', kcal:450, protein:30, carbs:35, fat:18, ingredients:['1 pan hamburguesa','120g carne de res molida magra asada','lechuga, tomate al gusto'] },
  { name:'Lomo de cerdo rebanado con espagueti rojo', cat:'Comida', kcal:550, protein:40, carbs:55, fat:16, ingredients:['150g lomo de cerdo fileteado','1 tz (140g) espagueti rojo cocido'] },
  { name:'Burritos gigantes de pollo, arroz y frijol', cat:'Comida', kcal:580, protein:40, carbs:65, fat:14, ingredients:['1 tortilla de harina grande (Tía Rosa)','100g pollo asado','1/2 tz arroz','1/3 tz frijoles'] },
  { name:'Caldo de pollo con verduras y garbanzos', cat:'Comida', kcal:450, protein:45, carbs:40, fat:10, ingredients:['150g pechuga de pollo en trozos','1/2 tz (80g) garbanzos cocidos','chayote y verdura de temporada','caldo base'] },
  { name:'Hígado encebollado con arroz', cat:'Comida', kcal:520, protein:40, carbs:55, fat:12, ingredients:['150g hígado de res fileteado encebollado','1 tz (150g) arroz blanco cocido'] },
  { name:'Atún con mayonesa light, elote y galletas habaneras', cat:'Comida', kcal:440, protein:35, carbs:45, fat:10, ingredients:['1.5 latas atún en agua','1/2 tz (80g) granos de elote de lata','1 cda mayonesa light','4 galletas habaneras'] },
  { name:'Tacos dorados de pollo al horno o freidora', cat:'Comida', kcal:480, protein:35, carbs:55, fat:14, ingredients:['4 tortillas de maíz enrolladas con 80g pollo (freidora de aire)','lechuga','2 cdas crema light'] },
  { name:'Alambre de res con pimiento, cebolla y queso panela', cat:'Comida', kcal:490, protein:40, carbs:35, fat:20, ingredients:['120g bistec de res en cubos','1/2 tz pimiento picado','40g queso panela en cubos','2 tortillas de maíz'] },
  { name:'Ensalada César casera con pollo a la plancha', cat:'Comida', kcal:430, protein:45, carbs:25, fat:15, ingredients:['2 tazas lechuga romana','150g pollo a la plancha','2 cdas aderezo César light','15g crutones'] },
  { name:'Cerdo entomatado con frijoles refritos', cat:'Comida', kcal:510, protein:38, carbs:35, fat:22, ingredients:['150g cerdo magro cocido en salsa tomate','1/2 tz (120g) frijoles refritos light de lata'] },
  { name:'Sopa de lentejas espesa con pollo', cat:'Comida', kcal:460, protein:42, carbs:55, fat:8, ingredients:['1.5 tz (300g) sopa espesa de lentejas','100g pechuga de pollo cocida dentro'] },
  { name:'Tazón de arroz con huevo cocido y salsa de soya', cat:'Comida', kcal:450, protein:18, carbs:65, fat:11, ingredients:['1.5 tz (225g) arroz blanco','2 huevos cocidos picados','1 cda salsa de soya'] },
  { name:'Carne deshebrada de res a la mexicana', cat:'Comida', kcal:520, protein:40, carbs:48, fat:18, ingredients:['150g falda de res deshebrada guisada','tomate, cebolla, chile al gusto','3 tortillas de maíz'] },
  { name:'Quesadillas de pollo (3 tortillas)', cat:'Comida', kcal:530, protein:45, carbs:45, fat:16, ingredients:['3 tortillas de maíz','60g queso panela','100g pechuga de pollo en tiras'] },
  { name:'Tazón de arroz con frijoles negros, elote y pollo', cat:'Comida', kcal:580, protein:40, carbs:80, fat:8, ingredients:['1 tz (150g) arroz','1/2 tz (120g) frijol negro','2 cdas elote de lata','100g pollo asado'] },
  { name:'Pescado empapelado con verduras picadas', cat:'Comida', kcal:380, protein:42, carbs:35, fat:6, ingredients:['200g filete de pescado blanco empapelado con vegetales','1/2 tz (75g) arroz cocido'] },
  { name:'Tortitas de carne molida rebajadas con avena', cat:'Comida', kcal:440, protein:35, carbs:20, fat:20, ingredients:['150g res molida magra + 20g avena (mezclado y hecho tortita al sartén)','ensalada de lechuga guarnición'] },
  { name:'Guisado de rajas poblanas con pollo y crema light', cat:'Comida', kcal:480, protein:38, carbs:38, fat:18, ingredients:['1 tz rajas de chile poblano','120g pollo deshebrado','2 cdas crema light','2 tortillas de maíz'] },
  { name:'Sopa de fideos con mollejas de pollo', cat:'Comida', kcal:410, protein:35, carbs:35, fat:12, ingredients:['1 tz (140g) sopa de fideos aguada','150g mollejas de pollo cocidas picadas'] },
  { name:'Cerdo en adobo con arroz blanco', cat:'Comida', kcal:540, protein:38, carbs:50, fat:18, ingredients:['150g lomo de cerdo guisado en adobo (chile ancho/pasilla)','1 tz (150g) arroz blanco'] },
  { name:'Tostadas de ceviche de soya texturizada', cat:'Comida', kcal:380, protein:28, carbs:45, fat:10, ingredients:['50g soya seca hidratada en jugo de limón con pepino y tomate','40g aguacate rebanado','2 tostadas horneadas'] },
  { name:'Medallones de atún congelado a la plancha con puré', cat:'Comida', kcal:450, protein:40, carbs:45, fat:8, ingredients:['150g medallón de atún congelado asado a la plancha','1 tz (200g) puré de papa casero'] },
  { name:'Pechuga de pollo rellena de queso y espinaca', cat:'Comida', kcal:420, protein:45, carbs:25, fat:12, ingredients:['120g pechuga abierta rellena con 30g queso panela y espinaca','1/2 tz (75g) arroz cocido'] },
  { name:'Estofado de res económico con papas y zanahorias', cat:'Comida', kcal:460, protein:30, carbs:40, fat:18, ingredients:['120g res magra en cubos guisada a fuego lento','1 tz (150g) papas y zanahorias picadas'] },
  // Snack / Post-Gym
  { name:'Scoop de Whey protein en agua', cat:'Snack', kcal:120, protein:24, carbs:3, fat:1, ingredients:['1 scoop Whey proteína','300ml agua fría en shaker'] },
  { name:'Scoop de Whey protein con plátano', cat:'Snack', kcal:225, protein:25, carbs:30, fat:1, ingredients:['1 scoop Whey proteína','1 plátano mediano entero'] },
  { name:'Licuado de leche y plátano', cat:'Snack', kcal:255, protein:9, carbs:39, fat:8, ingredients:['250ml leche entera','1 plátano mediano licuado'] },
  { name:'Yogurt griego con miel', cat:'Snack', kcal:120, protein:15, carbs:14, fat:0, ingredients:['150g yogurt griego natural sin grasa','1 cdita (5g) miel'] },
  { name:'3 Claras de huevo cocidas y 1 yema', cat:'Snack', kcal:105, protein:13, carbs:1, fat:5, ingredients:['3 claras de huevo cocidas','1 yema cocida','sal y pimienta'] },
  { name:'Queso cottage (150g) solo', cat:'Snack', kcal:140, protein:18, carbs:5, fat:6, ingredients:['150g queso cottage comercial'] },
  { name:'Leche con chocolate (chocomilk)', cat:'Snack', kcal:190, protein:9, carbs:23, fat:8, ingredients:['250ml leche entera','1 cda (15g) Choco Milk en polvo'] },
  { name:'Barra de proteína', cat:'Snack', kcal:210, protein:20, carbs:22, fat:7, ingredients:['1 barra de proteína estándar (~50g)'] },
  { name:'Sándwich de crema de cacahuate', cat:'Snack', kcal:240, protein:9, carbs:32, fat:10, ingredients:['2 rebanadas pan de caja integral','1 cda (15g) crema de cacahuate'] },
  { name:'Batido de suero de leche con avena licuada', cat:'Snack', kcal:235, protein:28, carbs:23, fat:3, ingredients:['1 scoop Whey proteína','30g avena cruda molida','agua en shaker'] },
  { name:'1 lata de atún en agua', cat:'Snack', kcal:90, protein:20, carbs:0, fat:1, ingredients:['1 lata atún en agua escurrida, consumo directo'] },
  { name:'Cereal (hojuelas de maíz) con leche y Whey', cat:'Snack', kcal:220, protein:18, carbs:32, fat:4, ingredients:['1 tz (30g) hojuelas maíz Corn Flakes','150ml leche entera','1/2 scoop Whey proteína'] },
  { name:'Fruta fresca picada con queso cottage', cat:'Snack', kcal:160, protein:13, carbs:22, fat:3, ingredients:['1 tz (150g) fruta de temporada picada','100g queso cottage'] },
  { name:'4 Salmas con hummus de garbanzo', cat:'Snack', kcal:140, protein:5, carbs:20, fat:5, ingredients:['4 galletas Salmas','2 cdas (30g) hummus de garbanzo'] },
  { name:'Pechuga de pavo en rollo con queso', cat:'Snack', kcal:140, protein:15, carbs:3, fat:8, ingredients:['3 rebanadas pechuga de pavo','30g queso panela en tiras envolviendo'] },
  { name:'Licuado de amaranto y vainilla', cat:'Snack', kcal:230, protein:12, carbs:28, fat:9, ingredients:['20g amaranto reventado','250ml leche entera','chorrito extracto de vainilla'] },
  { name:'Gelatina con yogur griego', cat:'Snack', kcal:70, protein:12, carbs:5, fat:0, ingredients:['1 envase gelatina light sin azúcar','100g yogurt griego natural encima'] },
  { name:'Tortita de arroz inflado con crema de maní y plátano', cat:'Snack', kcal:180, protein:5, carbs:23, fat:8, ingredients:['1 galleta de arroz inflado','1 cda (15g) crema de cacahuate','1/2 plátano en rodajas'] },
  { name:'Edamames al vapor', cat:'Snack', kcal:190, protein:17, carbs:15, fat:8, ingredients:['1 tz (150g) edamames congelados al vapor','sal marina al gusto'] },
  { name:'2 Huevos revueltos solos', cat:'Snack', kcal:140, protein:12, carbs:1, fat:10, ingredients:['2 huevos enteros revueltos en sartén antiadherente'] },
  { name:'Batido de claras pasteurizadas con saborizante de fresa', cat:'Snack', kcal:100, protein:22, carbs:2, fat:0, ingredients:['200ml claras líquidas pasteurizadas','saborizante en polvo sin azúcar'] },
  { name:'Cacahuates tostados sin sal', cat:'Snack', kcal:170, protein:7, carbs:6, fat:14, ingredients:['30g cacahuates tostados sin sal'] },
  { name:'Lala 100 directa del envase', cat:'Snack', kcal:110, protein:14, carbs:8, fat:2, ingredients:['250ml leche Lala 100 proteína directa del cartón'] },
  { name:'Hotcake de avena y proteína', cat:'Snack', kcal:170, protein:15, carbs:18, fat:3, ingredients:['20g avena molida','1/2 scoop Whey proteína','un poco de agua','a la sartén'] },
  { name:'Manzana con almendras', cat:'Snack', kcal:185, protein:4, carbs:28, fat:8, ingredients:['1 manzana mediana entera','15g almendras naturales'] },
  { name:'Yogurt para beber alto en proteína', cat:'Snack', kcal:180, protein:15, carbs:20, fat:3, ingredients:['1 envase (250g) yogurt bebible Yoplait Max proteína o similar'] },
  { name:'Sándwich de pollo asado', cat:'Snack', kcal:180, protein:15, carbs:15, fat:4, ingredients:['1 rebanada pan integral','50g pechuga de pollo asada rebanada fría'] },
  { name:'Requesón con galletas', cat:'Snack', kcal:170, protein:15, carbs:18, fat:5, ingredients:['100g requesón magro','4 galletas habaneras'] },
  { name:'Queso panela asado rebanado', cat:'Snack', kcal:180, protein:14, carbs:2, fat:13, ingredients:['80g queso panela rebanado grueso asado al sartén teflón'] },
  { name:'Licuado de papaya y yogur natural', cat:'Snack', kcal:120, protein:6, carbs:20, fat:3, ingredients:['1 tz (140g) papaya picada','100g yogurt natural sin azúcar'] },
  { name:'Bolitas de proteína caseras (avena, crema de maní, whey)', cat:'Snack', kcal:210, protein:16, carbs:15, fat:10, ingredients:['1 cda crema de maní','15g avena cruda','1/2 scoop Whey','hechas bolitas sin hornear'] },
  { name:'Tostadas sencillas de frijol', cat:'Snack', kcal:130, protein:6, carbs:22, fat:2, ingredients:['2 tostadas horneadas','2 cdas (30g) frijoles refritos untados'] },
  { name:'Pechuga de pollo asada fría', cat:'Snack', kcal:130, protein:25, carbs:0, fat:3, ingredients:['80g pechuga de pollo asada de sobra, comida fría'] },
  { name:'Leche de soya sabor vainilla', cat:'Snack', kcal:110, protein:7, carbs:14, fat:4, ingredients:['250ml bebida de soya sabor vainilla (Ades o similar)'] },
  { name:'Mix de nueces y pasas', cat:'Snack', kcal:160, protein:5, carbs:18, fat:9, ingredients:['15g nueces pecana','15g pasitas (uvas pasa)'] },
  { name:'Frijoles de olla con queso fresco', cat:'Snack', kcal:180, protein:10, carbs:22, fat:6, ingredients:['1/2 tz (120g) frijoles de la olla calientes','20g queso fresco espolvoreado'] },
  { name:'Atún con aguacate', cat:'Snack', kcal:140, protein:20, carbs:2, fat:6, ingredients:['1 lata atún en agua','30g aguacate machacado'] },
  { name:'Pan tostado con requesón y miel', cat:'Snack', kcal:150, protein:11, carbs:19, fat:3, ingredients:['1 rebanada pan tostado comercial','50g requesón','1 cdita (5g) miel'] },
  { name:'Café frío con leche y plátano', cat:'Snack', kcal:165, protein:5, carbs:32, fat:3, ingredients:['1 tz café negro frío','100ml leche entera','1 plátano entero'] },
  { name:'Avena remojada en leche con cacao', cat:'Snack', kcal:210, protein:9, carbs:32, fat:6, ingredients:['30g avena remojada en 150ml leche entera','1 cdita cacao en polvo'] },
  { name:'Cubitos de queso manchego', cat:'Snack', kcal:160, protein:9, carbs:1, fat:13, ingredients:['40g queso manchego cortado en cubos pequeños'] },
  { name:'Claras a la mexicana', cat:'Snack', kcal:70, protein:14, carbs:3, fat:0, ingredients:['4 claras de huevo (~120ml) revueltas','tomate, cebolla y chile picado'] },
  { name:'Galletas Marías con leche fría', cat:'Snack', kcal:230, protein:7, carbs:36, fat:6, ingredients:['8 galletas Marías','150ml leche entera fría'] },
  { name:'Smoothie de piña y proteína sin sabor', cat:'Snack', kcal:200, protein:25, carbs:22, fat:1, ingredients:['1 tz (165g) piña congelada','1 scoop Whey sin sabor','agua'] },
  { name:'Garbanzos cocidos condimentados', cat:'Snack', kcal:270, protein:15, carbs:45, fat:4, ingredients:['1 tz (160g) garbanzos cocidos de lata escurridos','paprika al gusto'] },
  { name:'Salchicha de pavo asada', cat:'Snack', kcal:100, protein:8, carbs:4, fat:6, ingredients:['2 salchichas de pavo partidas y asadas al sartén teflón'] },
  { name:'Tostada horneada con crema de cacahuate', cat:'Snack', kcal:140, protein:5, carbs:13, fat:8, ingredients:['1 tostada horneada de maíz','1 cda (15g) crema de cacahuate untada'] },
  { name:'Carne seca', cat:'Snack', kcal:80, protein:15, carbs:1, fat:2, ingredients:['30g carne seca machaca de res sin verduras'] },
  { name:'Plátano machacado con avena seca', cat:'Snack', kcal:165, protein:3, carbs:37, fat:1, ingredients:['1 plátano machacado','15g avena cruda (revueltos en un tazón)'] },
  { name:'Licuado de mamey con leche', cat:'Snack', kcal:220, protein:8, carbs:32, fat:7, ingredients:['1/4 tz (50g) pulpa de mamey','200ml leche entera'] },
  // Cena
  { name:'2 Huevos a la mexicana con 3 tortillas', cat:'Cena', kcal:350, protein:16, carbs:45, fat:12, ingredients:['2 huevos enteros','jitomate, cebolla, chile al gusto','3 tortillas de maíz'] },
  { name:'Sándwich de lomo de cerdo sobrante', cat:'Cena', kcal:320, protein:26, carbs:30, fat:10, ingredients:['2 rebanadas pan integral','100g lomo de cerdo cocido rebanado (sobras)'] },
  { name:'Tostadas de atún con aguacate', cat:'Cena', kcal:230, protein:22, carbs:20, fat:7, ingredients:['1 lata atún en agua escurrida','40g aguacate machacado','2 tostadas horneadas'] },
  { name:'Quesadillas de queso panela con pico de gallo', cat:'Cena', kcal:420, protein:25, carbs:45, fat:16, ingredients:['3 tortillas de maíz','90g queso panela','pico de gallo al gusto'] },
  { name:'Omelette de espinaca y champiñones', cat:'Cena', kcal:175, protein:20, carbs:4, fat:10, ingredients:['2 huevos enteros + 2 claras adicionales','espinaca fresca al gusto','1/2 tz champiñones rebanados'] },
  { name:'Sincronizada gigante de jamón en tortilla de harina', cat:'Cena', kcal:380, protein:20, carbs:35, fat:18, ingredients:['1 tortilla de harina grande','2 rebanadas jamón de pavo','40g queso oaxaca o asadero'] },
  { name:'Tacos de pechuga de pollo asada', cat:'Cena', kcal:410, protein:40, carbs:45, fat:8, ingredients:['3 tortillas de maíz','120g pechuga de pollo asada picada'] },
  { name:'Ensalada de lechuga con pollo asado picado', cat:'Cena', kcal:250, protein:38, carbs:8, fat:8, ingredients:['3 tazas lechuga y verduras verdes','120g pollo asado picado','1 cda vinagreta o aceite de oliva'] },
  { name:'Sándwich de jamón de pavo (doble porción)', cat:'Cena', kcal:290, protein:20, carbs:30, fat:10, ingredients:['2 rebanadas pan integral','4 rebanadas (~60g) jamón de pavo','20g queso panela'] },
  { name:'Hotcakes de avena, clara de huevo y plátano', cat:'Cena', kcal:240, protein:16, carbs:40, fat:3, ingredients:['40g avena molida','3 claras de huevo (90ml)','1/2 plátano machacado en la mezcla'] },
  { name:'Pan tostado con aguacate y 2 huevos estrellados', cat:'Cena', kcal:400, protein:20, carbs:35, fat:20, ingredients:['2 rebanadas pan tostado','40g aguacate untado','2 huevos estrellados encima'] },
  { name:'Tazón de yogur griego con avena y almendras', cat:'Cena', kcal:320, protein:24, carbs:32, fat:12, ingredients:['200g yogurt griego natural','30g avena cruda','15g almendras fileteadas'] },
  { name:'Molletes de pan integral con frijoles y queso', cat:'Cena', kcal:380, protein:22, carbs:50, fat:12, ingredients:['1 pieza pan integral partido a la mitad','1/2 tz frijoles machacados untados','50g queso panela derretido'] },
  { name:'Tacos de atún guisado a la mexicana', cat:'Cena', kcal:300, protein:24, carbs:45, fat:3, ingredients:['1 lata atún guisada con jitomate y cebolla','3 tortillas de maíz'] },
  { name:'Wrap de atún con lechuga en tortilla de harina', cat:'Cena', kcal:320, protein:25, carbs:35, fat:8, ingredients:['1 tortilla de harina grande','1 lata atún escurrida','hojas de lechuga romana'] },
  { name:'Huevos revueltos con jamón', cat:'Cena', kcal:320, protein:18, carbs:30, fat:12, ingredients:['2 huevos enteros revueltos','2 rebanadas jamón de pavo picadas','2 tortillas de maíz'] },
  { name:'Queso cottage dulce con fruta y nuez', cat:'Cena', kcal:280, protein:26, carbs:20, fat:12, ingredients:['200g queso cottage','1/2 manzana picada (75g)','10g nuez picada'] },
  { name:'Fajitas de res en tacos (sobras)', cat:'Cena', kcal:380, protein:28, carbs:45, fat:10, ingredients:['100g fajitas o bistec de res (sobras)','3 tortillas de maíz'] },
  { name:'Ensalada de atún con huevo cocido y pepino', cat:'Cena', kcal:180, protein:28, carbs:5, fat:6, ingredients:['1 lata atún en agua','1 huevo cocido duro picado','1 tz pepino en cubos','jugo de limón'] },
  { name:'Sopa de fideo con pollo deshebrado', cat:'Cena', kcal:310, protein:35, carbs:30, fat:6, ingredients:['1 tz (140g) sopa de fideos aguada','100g pollo deshebrado mezclado'] },
  { name:'Burrito de frijol, arroz y queso panela', cat:'Cena', kcal:390, protein:18, carbs:55, fat:10, ingredients:['1 tortilla de harina grande','1/2 tz frijol refrito','1/4 tz (35g) arroz de sobra','40g queso panela'] },
  { name:'Champiñones al ajillo con trozos de pollo asado', cat:'Cena', kcal:280, protein:40, carbs:15, fat:8, ingredients:['1 tz champiñones guisados al ajillo','120g pollo asado en trozos','1 rebanada pan tostado'] },
  { name:'Huevos revueltos con salchicha de pavo', cat:'Cena', kcal:360, protein:18, carbs:32, fat:16, ingredients:['2 huevos enteros revueltos','2 salchichas de pavo en rodajas','2 tortillas de maíz'] },
  { name:'Queso panela asado en salsa verde con tortillas', cat:'Cena', kcal:440, protein:28, carbs:35, fat:24, ingredients:['150g queso panela rebanado asado al sartén','salsa verde natural','2 tortillas de maíz'] },
  { name:'Sándwich de ensalada de huevo', cat:'Cena', kcal:350, protein:18, carbs:30, fat:16, ingredients:['2 rebanadas pan integral','2 huevos duros picados','1 cda mayonesa light'] },
  { name:'Tacos de queso oaxaca fundido', cat:'Cena', kcal:410, protein:18, carbs:45, fat:16, ingredients:['60g queso oaxaca deshebrado fundido al sartén','3 tortillas de maíz'] },
  { name:'Tostadas con tinga de pollo', cat:'Cena', kcal:340, protein:32, carbs:38, fat:8, ingredients:['100g pollo deshebrado en tinga (chipotle)','3 tostadas horneadas Sanísimo'] },
  { name:'Avena caliente cocida en leche con canela', cat:'Cena', kcal:250, protein:11, carbs:35, fat:8, ingredients:['40g avena cruda cocida a la estufa','200ml leche entera','canela al gusto'] },
  { name:'Pechuga de pollo asada con ensalada de pepino y tomate', cat:'Cena', kcal:280, protein:48, carbs:15, fat:4, ingredients:['150g pechuga de pollo asada','pepino y tomate crudos al gusto','1 tostada horneada'] },
  { name:'Pizza casera en pan pita con puré de tomate y queso', cat:'Cena', kcal:330, protein:18, carbs:35, fat:12, ingredients:['1 pan pita integral','2 cdas puré de tomate','50g queso oaxaca fundido al horno'] },
  { name:'Huevos revueltos con ejotes y cebolla', cat:'Cena', kcal:280, protein:15, carbs:32, fat:10, ingredients:['2 huevos revueltos','1 tz ejotes cocidos picados','cebolla al gusto','2 tortillas de maíz'] },
  { name:'Tostadas de ceviche de atún', cat:'Cena', kcal:200, protein:22, carbs:22, fat:2, ingredients:['1 lata atún en agua mezclada con tomate, cebolla y limón','2 tostadas horneadas'] },
  { name:'Rollitos de jamón, queso y espinaca en tortilla', cat:'Cena', kcal:280, protein:16, carbs:25, fat:12, ingredients:['1 tortilla de harina grande','2 reb jamón de pavo','30g queso panela','hojas de espinaca'] },
  { name:'Arroz frito sobrante con huevo estrellado', cat:'Cena', kcal:240, protein:9, carbs:28, fat:10, ingredients:['1/2 tz (75g) arroz blanco salteado al sartén','1 huevo estrellado encima','salsa de soya'] },
  { name:'Sándwich de crema de maní y plátano', cat:'Cena', kcal:340, protein:11, carbs:45, fat:14, ingredients:['2 rebanadas pan integral','1.5 cdas (22g) crema de cacahuate','1/2 plátano en rodajas'] },
  { name:'Crepas saladas de pollo y queso', cat:'Cena', kcal:310, protein:35, carbs:25, fat:8, ingredients:['2 crepas (15g avena + 2 claras, a la sartén)','80g pollo asado picado','20g queso panela'] },
  { name:'Salpicón de res en tostadas', cat:'Cena', kcal:270, protein:26, carbs:25, fat:8, ingredients:['100g carne res deshebrada','verduras crudas picadas y vinagre','2 tostadas horneadas'] },
  { name:'Huevos al albañil en salsa roja con frijoles', cat:'Cena', kcal:400, protein:18, carbs:45, fat:12, ingredients:['2 huevos revueltos en salsa roja','1/2 tz (120g) frijoles de olla','2 tortillas de maíz'] },
  { name:'Bowl de arroz, atún, aguacate y salsa soya', cat:'Cena', kcal:280, protein:24, carbs:30, fat:6, ingredients:['1/2 tz (75g) arroz blanco','1 lata atún encima','30g aguacate rebanado','gotas de salsa de soya'] },
  { name:'Ensalada caprese de queso panela, tomate y orégano', cat:'Cena', kcal:260, protein:16, carbs:20, fat:14, ingredients:['80g queso panela en cubos','1 tomate rebanado','orégano y aceite de oliva','1 pan tostado integral'] },
  { name:'Tacos de requesón a la plancha', cat:'Cena', kcal:320, protein:18, carbs:48, fat:8, ingredients:['80g requesón embarrado en 3 tortillas de maíz (tipo quesadilla)'] },
  { name:'Sándwich de atún caliente tostado con queso', cat:'Cena', kcal:340, protein:30, carbs:30, fat:10, ingredients:['2 rebanadas pan integral','1 lata atún','1 rebanada (15g) queso manchego','tostado al sartén'] },
  { name:'Chilaquiles ligeros con huevo revuelto', cat:'Cena', kcal:320, protein:16, carbs:30, fat:14, ingredients:['30g totopos horneados Sanísimo bañados en salsa verde','2 huevos revueltos'] },
  { name:'Fajitas de pollo con verduras asadas', cat:'Cena', kcal:350, protein:38, carbs:35, fat:8, ingredients:['120g pechuga de pollo en tiras asadas','pimientos y cebolla al sartén','2 tortillas de maíz'] },
  { name:'Huevos con nopales y tortillas', cat:'Cena', kcal:280, protein:15, carbs:32, fat:10, ingredients:['2 huevos enteros revueltos','1 tz nopales cocidos picados','2 tortillas de maíz'] },
  { name:'Tazón de lentejas con salchicha', cat:'Cena', kcal:330, protein:18, carbs:45, fat:10, ingredients:['1 tz (200g) sopa de lentejas','1 salchicha de pavo picada dentro','1 tortilla de maíz'] },
  { name:'Tostadas de aguacate con requesón y chile', cat:'Cena', kcal:230, protein:12, carbs:22, fat:10, ingredients:['2 tostadas horneadas','40g aguacate untado base','50g requesón desmenuzado','chile quebrado'] },
  { name:'Filete de pescado a la plancha con arroz', cat:'Cena', kcal:280, protein:32, carbs:28, fat:4, ingredients:['150g filete pescado blanco a la plancha sin aceite','1/2 tz (75g) arroz blanco','guarnición de verdura libre'] },
  { name:'Licuado cargado (avena, leche, crema de maní, whey)', cat:'Cena', kcal:360, protein:25, carbs:35, fat:14, ingredients:['30g avena cruda','200ml leche entera','1 cda (15g) crema de cacahuate','1/2 scoop Whey (licuar todo)'] },
  { name:'2 Huevos revueltos con machaca', cat:'Cena', kcal:340, protein:25, carbs:30, fat:12, ingredients:['2 huevos enteros revueltos','30g machaca de res','2 tortillas de maíz'] },
]

const CAT_COLORS = {
  Desayuno: '#c9a227',
  Colación:  '#4cae8a',
  Comida:   '#e05c5c',
  Snack:    '#9575cd',
  Cena:     '#5b84e8',
}
const CAT_ICONS = { Desayuno: SunHorizon, Colación: Backpack, Comida: ForkKnife, Snack: Barbell, Cena: Moon }

// ── Constantes ────────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { key:'lunes',     short:'Lun', label:'Lunes'     },
  { key:'martes',    short:'Mar', label:'Martes'    },
  { key:'miercoles', short:'Mié', label:'Miércoles' },
  { key:'jueves',    short:'Jue', label:'Jueves'    },
  { key:'viernes',   short:'Vie', label:'Viernes'   },
  { key:'sabado',    short:'Sáb', label:'Sábado'    },
  { key:'domingo',   short:'Dom', label:'Domingo'   },
]
const DOW_TO_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const QUICK_NAMES = ['Desayuno','Merienda','Almuerzo','Snack','Cena','Pre-entreno','Post-entreno']

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5)
const localToday = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const nowTime    = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
const toMins     = t => { const [h,m]=t.split(':').map(Number); return h*60+m }
const minsUntil  = t => { const d=toMins(t)-toMins(nowTime()); return d<0?d+1440:d }
const fmt12      = t => { const [h,m]=t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` }
const fmtCountdown = mins => {
  if (mins<=0) return 'Ahora'
  if (mins<60)  return `en ${mins}min`
  const h=Math.floor(mins/60), m=mins%60
  return m>0 ? `en ${h}h ${m}min` : `en ${h}h`
}

// ── MacroBar ──────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color }) {
  const pct = goal>0 ? Math.min(100, Math.round((value/goal)*100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-mid">{label}</span>
        <span className="text-[11px] font-mono" style={{ color }}>{value}<span className="text-lo">/{goal}g</span></span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, backgroundColor:color }}/>
      </div>
    </div>
  )
}

// ── HistorialTab ──────────────────────────────────────────────────────────────
const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function HistorialTab({ ambito, meals, goals, onDelete }) {
  const [expandedDay, setExpandedDay] = useState(null)
  const today = localToday()

  // Group meals by date, sorted most recent first
  const groups = useMemo(() => {
    const idx = {}
    meals.forEach(m => {
      if (!idx[m.date]) idx[m.date] = []
      idx[m.date].push(m)
    })
    return Object.entries(idx)
      .sort(([a],[b]) => b.localeCompare(a))
  }, [meals])

  if (groups.length === 0) {
    return (
      <div className="card py-10 text-center">
        <Clock size={32} className="mx-auto mb-2 text-lo" weight="duotone"/>
        <p className="text-[13px] text-lo">Sin historial aún.</p>
        <p className="text-[12px] text-lo mt-1">Registra comidas en la pestaña Hoy.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map(([date, dayMeals]) => {
        const d = new Date(date + 'T12:00')
        const isToday = date === today
        const totalCal  = dayMeals.reduce((a,m) => a + (Number(m.calories)||0), 0)
        const totalProt = dayMeals.reduce((a,m) => a + (Number(m.protein)||0), 0)
        const totalCarb = dayMeals.reduce((a,m) => a + (Number(m.carbs)||0), 0)
        const totalFat  = dayMeals.reduce((a,m) => a + (Number(m.fat)||0), 0)
        const pct = goals.calories > 0 ? Math.min(1, totalCal / goals.calories) : 0
        const isOpen = expandedDay === date

        return (
          <div key={date} className="rounded-2xl overflow-hidden"
            style={{ border:`1px solid ${isOpen ? ambito.color+'44' : '#1e1e1e'}`, backgroundColor:'#0d0d0d' }}>

            {/* Cabecera del día — tap para expandir */}
            <button className="w-full text-left px-4 py-3"
              onClick={() => setExpandedDay(isOpen ? null : date)}>
              <div className="flex items-center gap-3">
                {/* Fecha */}
                <div className="text-center shrink-0 w-9">
                  <p className="text-[10px] text-lo uppercase tracking-wide leading-none">
                    {isToday ? 'Hoy' : DAY_NAMES[d.getDay()].slice(0,3)}
                  </p>
                  <p className="text-[20px] font-bold leading-tight" style={{color: isToday ? ambito.color : '#ccc'}}>
                    {d.getDate()}
                  </p>
                  <p className="text-[9px] text-lo leading-none">{MONTH_SHORT[d.getMonth()]}</p>
                </div>

                {/* Barra + macros */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold" style={{color: isToday ? ambito.color : '#ccc'}}>
                      {totalCal} kcal
                    </span>
                    <span className="text-[11px] text-lo">{dayMeals.length} comida{dayMeals.length !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Barra progreso */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#1a1a1a'}}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width:`${pct*100}%`, backgroundColor: pct >= 1 ? '#4cae8a' : ambito.color }}/>
                  </div>
                  {/* Macros fila */}
                  <div className="flex gap-3 mt-1.5">
                    {totalProt > 0 && <span className="text-[10px]" style={{color:'#5b84e8'}}>P {totalProt}g</span>}
                    {totalCarb > 0 && <span className="text-[10px]" style={{color:'#c9a227'}}>C {totalCarb}g</span>}
                    {totalFat  > 0 && <span className="text-[10px]" style={{color:'#4cae8a'}}>G {totalFat}g</span>}
                  </div>
                </div>
              </div>
            </button>

            {/* Lista de comidas expandida */}
            {isOpen && (
              <div className="px-3 pb-3 space-y-1.5 border-t" style={{borderColor: ambito.color+'22'}}>
                {dayMeals
                  .slice()
                  .sort((a,b) => (a.time||'').localeCompare(b.time||''))
                  .map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{backgroundColor:'#111', border:'1px solid #1a1a1a'}}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-hi truncate">{m.name}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {m.calories > 0 && <span className="text-[10px] font-semibold" style={{color:'#e07c4a'}}>{m.calories} kcal</span>}
                        {m.protein  > 0 && <span className="text-[10px]" style={{color:'#5b84e8'}}>P {m.protein}g</span>}
                        {m.carbs    > 0 && <span className="text-[10px]" style={{color:'#c9a227'}}>C {m.carbs}g</span>}
                        {m.fat      > 0 && <span className="text-[10px]" style={{color:'#4cae8a'}}>G {m.fat}g</span>}
                      </div>
                    </div>
                    {m.time && <span className="text-[10px] text-lo shrink-0">{m.time}</span>}
                    <button onClick={() => onDelete(m.id)}
                      className="shrink-0 p-1 text-lo hover:text-red-400 transition-colors">
                      <Trash size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── AlimentacionView ──────────────────────────────────────────────────────────
const TABS = ['Hoy', 'Plan', 'Historial', 'Alimentos']

// ── CalendarTab ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW_SHORT   = ['D','L','M','X','J','V','S']
const pad2 = n => String(n).padStart(2,'0')
const mkDate = (y,m,d) => `${y}-${pad2(m+1)}-${pad2(d)}`
const DOW_TO_KEY2 = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']

function CalendarTab({ ambito, meals, weekPlan, goals }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selDay, setSelDay] = useState(null)

  const todayStr = mkDate(now.getFullYear(), now.getMonth(), now.getDate())

  // Index meals by date
  const mealsByDate = useMemo(() => {
    const idx = {}
    meals.forEach(m => {
      if (!idx[m.date]) idx[m.date] = []
      idx[m.date].push(m)
    })
    return idx
  }, [meals])

  // Calendar grid
  const firstDow  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1)
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1)

  // Selected day data
  const selDateStr = selDay ? mkDate(year, month, selDay) : null
  const selMeals   = selDateStr ? (mealsByDate[selDateStr] || []) : []
  const selDow     = selDateStr ? DOW_TO_KEY2[new Date(selDateStr+'T12:00').getDay()] : null
  const selPlan    = selDow    ? (weekPlan[selDow] || []).slice().sort((a,b)=>a.time.localeCompare(b.time)) : []
  const selCals    = selMeals.reduce((a,m)=>a+(Number(m.calories)||0), 0)
  const selProt    = selMeals.reduce((a,m)=>a+(Number(m.protein)||0), 0)
  const calGoal    = goals.calories || 0

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lo hover:text-mid transition-all"
          style={{ border:'1px solid #1e1e1e' }}>
          <CaretLeft size={13}/>
        </button>
        <span className="text-[14px] font-bold text-hi">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lo hover:text-mid transition-all"
          style={{ border:'1px solid #1e1e1e' }}>
          <CaretRight size={13}/>
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7">
        {DOW_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-lo py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`}/>
          const ds    = mkDate(year, month, day)
          const ms    = mealsByDate[ds] || []
          const cals  = ms.reduce((a,m)=>a+(Number(m.calories)||0), 0)
          const pct   = calGoal > 0 ? Math.min(1, cals / calGoal) : 0
          const hasMeals = ms.length > 0
          const isToday  = ds === todayStr
          const isSel    = selDay === day
          return (
            <button key={ds} onClick={() => setSelDay(isSel ? null : day)}
              className="rounded-xl flex flex-col items-center py-1.5 px-0.5 gap-1 transition-all active:scale-95"
              style={{
                backgroundColor: isSel ? ambito.color+'20' : isToday ? '#ffffff08' : 'transparent',
                border: isSel ? `1px solid ${ambito.color}60` : isToday ? `1px solid ${ambito.color}30` : '1px solid transparent',
                minHeight: 52,
              }}>
              <span className="text-[12px] font-semibold leading-none"
                style={{ color: isToday ? ambito.color : isSel ? '#fff' : hasMeals ? '#bbb' : '#3a3a3a' }}>
                {day}
              </span>
              {/* Progress bar */}
              {hasMeals && (
                <div className="w-full px-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor:'#1a1a1a' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width:`${Math.round(pct*100)}%`, backgroundColor: pct>=1 ? '#4cae8a' : ambito.color }}/>
                  </div>
                </div>
              )}
              {hasMeals && calGoal > 0 && (
                <span className="text-[8px] font-mono leading-none" style={{ color: ambito.color+'99' }}>
                  {cals}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-lo px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: ambito.color }}/>
          <span>Calorías del día</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: '#4cae8a' }}/>
          <span>Meta alcanzada</span>
        </div>
      </div>

      {/* Day detail */}
      {selDay && (
        <div className="rounded-2xl overflow-hidden" style={{ border:`1px solid ${ambito.color}30`, backgroundColor:'#0a0a0a' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom:'1px solid #1a1a1a', background:`linear-gradient(135deg,${ambito.color}12,transparent)` }}>
            <div>
              <p className="text-[14px] font-bold text-hi">
                {new Date(selDateStr+'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}
              </p>
              {selDateStr === todayStr && <span className="text-[10px] font-bold" style={{ color: ambito.color }}>Hoy</span>}
            </div>
            <button onClick={() => setSelDay(null)} className="text-lo hover:text-mid transition-colors p-1">
              <X size={13}/>
            </button>
          </div>

          {/* Macro summary */}
          {selMeals.length > 0 && (
            <div className="grid grid-cols-3 divide-x px-4 py-3" style={{ borderBottom:'1px solid #1a1a1a', borderColor:'#1a1a1a' }}>
              {[
                { label:'Calorías', val: selCals, unit:'kcal', color: ambito.color, goal: goals.calories },
                { label:'Proteína', val: selProt, unit:'g',    color:'#5b84e8',     goal: goals.protein  },
                { label:'Carbos',   val: selMeals.reduce((a,m)=>a+(Number(m.carbs)||0),0), unit:'g', color:'#c9a227', goal: goals.carbs },
              ].map(({ label, val, unit, color, goal }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 px-2">
                  <span className="text-[9px] text-lo uppercase tracking-wider">{label}</span>
                  <span className="text-[16px] font-black font-mono" style={{ color }}>{val}</span>
                  <span className="text-[9px] text-lo">{unit}{goal>0?` / ${goal}`:''}</span>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 space-y-3">
            {/* Plan del día */}
            {selPlan.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2">Plan del día</p>
                <div className="space-y-1.5">
                  {selPlan.map(pm => {
                    const logged = selMeals.filter(m => m.planId === pm.id)
                    const pmCals = logged.reduce((a,m)=>a+(Number(m.calories)||0),0)
                    return (
                      <div key={pm.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: logged.length>0 ? ambito.color+'10' : '#111', border:`1px solid ${logged.length>0?ambito.color+'30':'#1e1e1e'}` }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: logged.length>0 ? ambito.color+'30' : '#1e1e1e' }}>
                          {logged.length>0
                            ? <Check size={10} weight="bold" style={{ color: ambito.color }}/>
                            : <Clock size={9} style={{ color:'#444' }}/>
                          }
                        </div>
                        <span className="text-[12px] font-semibold flex-1"
                          style={{ color: logged.length>0 ? '#ccc' : '#555' }}>{pm.name}</span>
                        <span className="text-[11px] font-mono" style={{ color: ambito.color+'80' }}>
                          {pm.time.slice(0,5)}
                        </span>
                        {pmCals > 0 && <span className="text-[10px] text-lo">{pmCals}kcal</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Alimentos registrados */}
            {selMeals.length > 0 ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2">Registrado</p>
                <div className="space-y-1">
                  {selMeals.map(m => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor:'#111', border:'1px solid #1a1a1a' }}>
                      <span className="text-[12px] text-mid flex-1 truncate">{m.name}</span>
                      {m.calories>0 && <span className="text-[10px]" style={{ color: ambito.color }}>{m.calories}kcal</span>}
                      {m.protein>0  && <span className="text-[10px]" style={{ color:'#5b84e8' }}>P{m.protein}g</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-lo text-center py-3">Sin alimentos registrados este día</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
const MACRO_COLORS = { calories:'#e07c4a', protein:'#5b84e8', carbs:'#c9a227', fat:'#4cae8a' }

export default function AlimentacionView({ ambito }) {
  const habits  = getHabits()
  const [tab, setTab]         = useState('Hoy')
  const [weekPlan, setWeekPlan] = useState(getMealPlanWeekly)
  const [meals,  setMeals]    = useState(getMeals)
  const [goals,  setGoals]    = useState(getDietGoals)
  const [, setTick]           = useState(0)

  // Plan tab: which day is selected
  const todayKey   = DOW_TO_KEY[new Date().getDay()]
  const [planDay, setPlanDay] = useState(todayKey)

  // Recipes
  const [recipes,      setRecipes]      = useState(getRecipes)
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [recipeForm,   setRecipeForm]   = useState({ name:'', emoji:'🍳', ingredients:[] })
  const [recipeIngSearch, setRecipeIngSearch] = useState('')
  const [foodSubTab,   setFoodSubTab]   = useState('biblioteca') // 'biblioteca' | 'recetas'
  const [recipeFilter, setRecipeFilter] = useState('Todas')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [expandedPreset, setExpandedPreset] = useState(null)
  const [sugOpen, setSugOpen] = useState(false)

  // Sugerencias aleatorias — se recomputan una vez por montaje
  const sugPicks = useMemo(() => {
    const h = new Date().getHours()
    const cat =
      h >= 6  && h < 11 ? 'Desayuno' :
      h >= 11 && h < 13 ? 'Colación' :
      h >= 13 && h < 16 ? 'Comida'   :
      h >= 16 && h < 20 ? 'Snack'    :
      h >= 20            ? 'Cena'     : 'Desayuno'
    const pool = PRESET_RECIPES.filter(r => r.cat === cat)
    return { cat, picks: pool.sort(() => Math.random() - 0.5).slice(0, 4) }
  }, []) // eslint-disable-line

  // Food library
  const [foodLib,    setFoodLib]    = useState(getFoodLibrary)
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [foodSearchFor,  setFoodSearchFor]  = useState(null) // planMeal
  const [foodSearchMode, setFoodSearchMode] = useState('log') // 'log' | 'plan'
  const [showAddFood,    setShowAddFood]    = useState(false) // add to personal library
  const [foodForm,       setFoodForm]       = useState({ name:'', emoji:'🍽', per100:{ calories:'', protein:'', carbs:'', fat:'' }, useServing:false, servingUnit:'', servingGrams:'' })

  // Modals
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [editMeal,    setEditMeal]    = useState(null)
  const [showGoals,   setShowGoals]   = useState(false)
  const [showCopyFrom, setShowCopyFrom] = useState(false)

  // Forms
  const [mealForm, setMealForm] = useState({ name:'', time:'08:00' })
  const [goalForm, setGoalForm] = useState(goals)

  // Live clock (every minute)
  useEffect(() => {
    const id = setInterval(() => setTick(t=>t+1), 60000)
    return () => clearInterval(id)
  }, [])

  const today    = localToday()
  const nowMins  = toMins(nowTime())

  // Today's plan sorted by time
  const todayPlan   = (weekPlan[todayKey] || []).slice().sort((a,b)=>a.time.localeCompare(b.time))
  const selectedDayPlan = (weekPlan[planDay] || []).slice().sort((a,b)=>a.time.localeCompare(b.time))

  const todayMeals  = meals.filter(m => m.date === today)
  const logsFor     = pid => todayMeals.filter(m => m.planId === pid)

  const nextMeal    = todayPlan.find(p => toMins(p.time) > nowMins)
  const currentMeal = todayPlan.find(p => { const d=nowMins-toMins(p.time); return d>=0&&d<=30 })
  const heroMeal    = currentMeal || nextMeal

  const totals = todayMeals.reduce((a,m)=>({
    protein:  a.protein  + (Number(m.protein)||0),
    carbs:    a.carbs    + (Number(m.carbs)||0),
    fat:      a.fat      + (Number(m.fat)||0),
    calories: a.calories + (Number(m.calories)||0),
  }), { protein:0, carbs:0, fat:0, calories:0 })
  const calPct = goals.calories>0 ? Math.min(100, Math.round((totals.calories/goals.calories)*100)) : 0

  // ── Racha de cumplimiento ────────────────────────────────────────────────────
  const streak = useMemo(() => {
    if (!goals.calories) return 0
    const mealsByDate = {}
    meals.forEach(m => { if (!mealsByDate[m.date]) mealsByDate[m.date] = 0; mealsByDate[m.date] += (Number(m.calories)||0) })
    let count = 0
    const d = new Date()
    // don't count today (in progress)
    d.setDate(d.getDate() - 1)
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if ((mealsByDate[ds] || 0) >= goals.calories * 0.85) { count++; d.setDate(d.getDate()-1) }
      else break
      if (count > 365) break
    }
    return count
  }, [meals, goals])

  // ── Tendencias (últimos 7 días) ───────────────────────────────────────────
  const weekTrend = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const dayMeals = meals.filter(m => m.date === ds)
      const cals = dayMeals.reduce((a,m)=>a+(Number(m.calories)||0), 0)
      const prot = dayMeals.reduce((a,m)=>a+(Number(m.protein)||0), 0)
      days.push({ label: ['D','L','M','X','J','V','S'][d.getDay()], date: ds, cals, prot, isToday: i===0 })
    }
    return days
  }, [meals])

  // ── Plan helpers ────────────────────────────────────────────────────────────
  const persist = wp => { setWeekPlan(wp); saveMealPlanWeekly(wp) }

  const addMealToPlan = (dayKey) => {
    if (!mealForm.name.trim()) return
    const updated = { ...weekPlan, [dayKey]: [...(weekPlan[dayKey]||[]), { id:uid(), name:mealForm.name.trim(), time:mealForm.time }] }
    persist(updated)
    setMealForm({ name:'', time:'08:00' }); setShowAddMeal(false)
  }

  const saveEditMeal = () => {
    if (!editMeal) return
    const { dayKey, meal } = editMeal
    persist({ ...weekPlan, [dayKey]: weekPlan[dayKey].map(m => m.id===meal.id ? meal : m) })
    setEditMeal(null)
  }

  const deleteMealFromPlan = (dayKey, id) =>
    persist({ ...weekPlan, [dayKey]: weekPlan[dayKey].filter(m => m.id!==id) })

  const copyDayToAll = (fromKey) => {
    const source = weekPlan[fromKey] || []
    const updated = {}
    WEEK_DAYS.forEach(d => {
      updated[d.key] = d.key===fromKey ? source : source.map(m => ({ ...m, id:`${d.key}-${uid()}` }))
    })
    persist({ ...weekPlan, ...updated })
  }

  const copyDayTo = (fromKey, toKey) => {
    const source = weekPlan[fromKey] || []
    persist({ ...weekPlan, [toKey]: source.map(m => ({ ...m, id:`${toKey}-${uid()}` })) })
    setShowCopyFrom(false)
  }

  // ── Log helpers ─────────────────────────────────────────────────────────────
  const openFoodSearch = pm => { setFoodSearchMode('log'); setFoodSearchFor(pm); setShowFoodSearch(true) }
  const openPlanFoodSearch = (dayKey, pm) => { setFoodSearchMode('plan'); setFoodSearchFor({ ...pm, _dayKey: dayKey }); setShowFoodSearch(true) }
  const handleFoodAdd  = foodData => {
    if (foodSearchMode === 'plan' && foodSearchFor?._dayKey) {
      const { _dayKey, ...pm } = foodSearchFor
      const food = { id: Date.now().toString(36), name: foodData.name, calories: foodData.calories, protein: foodData.protein, carbs: foodData.carbs, fat: foodData.fat }
      const updated = {
        ...weekPlan,
        [_dayKey]: (weekPlan[_dayKey] || []).map(m =>
          m.id === pm.id ? { ...m, foods: [...(m.foods || []), food] } : m
        )
      }
      persist(updated)
    } else {
      setMeals(addMeal(foodData))
    }
  }
  const removePlanFood = (dayKey, mealId, foodId) => {
    const updated = {
      ...weekPlan,
      [dayKey]: (weekPlan[dayKey] || []).map(m =>
        m.id === mealId ? { ...m, foods: (m.foods || []).filter(f => f.id !== foodId) } : m
      )
    }
    persist(updated)
  }

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits} extra={
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowGoals(true)}
            className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
            <Gear size={15}/>
          </button>
          <div className="flex gap-1 bg-[#111] rounded-lg p-0.5 whitespace-nowrap">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="text-[12px] px-3 py-1 rounded-md transition-all"
                style={tab===t ? { backgroundColor:ambito.color+'22', color:ambito.color, fontWeight:600 } : { color:'#555' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      }/>

      <div className="p-3 md:p-5">

        {/* ── HOY ──────────────────────────────────────────────────────────── */}
        {tab === 'Hoy' && (
          <div className="space-y-4">

            {/* ── Sugerencias por hora ────────────────────────────────── */}
            {(() => {
              const { cat, picks } = sugPicks
              const catColor = CAT_COLORS[cat]
              const CatIcon  = CAT_ICONS[cat]
              const label = {
                Desayuno:'Buenos días · desayuno',
                Colación:'Media mañana · colación',
                Comida:'Es mediodía · a comer',
                Snack:'Buenas tardes · snack',
                Cena:'Buenas noches · cena',
              }[cat]
              return (
                <div className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor:'#0a0a0a', border:`1px solid ${catColor}${sugOpen?'35':'20'}` }}>

                  {/* Header — tap para colapsar */}
                  <button className="w-full flex items-center gap-2 px-4 py-3"
                    onClick={() => setSugOpen(o => !o)}>
                    {CatIcon && <CatIcon size={16} weight="duotone" style={{color: catColor}}/>}
                    <p className="flex-1 text-left text-[13px] font-bold" style={{color: catColor}}>{label}</p>
                    <span className="text-[10px] text-lo mr-1">{picks.length} sugerencias</span>
                    <span className="text-lo transition-transform duration-200"
                      style={{display:'inline-block', transform: sugOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                      <CaretLeft size={12} weight="bold" style={{transform:'rotate(-90deg)'}}/>
                    </span>
                  </button>

                  {/* Cuerpo colapsable */}
                  {sugOpen && (
                    <div className="px-3 pb-3 space-y-2 border-t" style={{borderColor: catColor+'18'}}>
                      {picks.map((r, i) => (
                        <div key={i} className="rounded-xl overflow-hidden mt-2"
                          style={{ backgroundColor:'#111', border:`1px solid ${catColor}20` }}>
                          {/* Nombre + macros */}
                          <div className="px-3.5 pt-3 pb-2">
                            <p className="text-[15px] font-black text-hi leading-snug">{r.name}</p>
                            <div className="flex gap-3 mt-1.5 flex-wrap">
                              <span className="text-[11px] font-bold" style={{color:'#e07c4a'}}>{r.kcal} kcal</span>
                              <span className="text-[11px]" style={{color:'#5b84e8'}}>P {r.protein}g</span>
                              <span className="text-[11px]" style={{color:'#c9a227'}}>C {r.carbs}g</span>
                              <span className="text-[11px]" style={{color:'#4cae8a'}}>G {r.fat}g</span>
                            </div>
                          </div>
                          {/* Ingredientes chips */}
                          {r.ingredients && r.ingredients.length > 0 && (
                            <div className="px-3.5 pb-2.5 flex flex-wrap gap-1.5">
                              {r.ingredients.map((ing, j) => (
                                <span key={j} className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: catColor+'10', color: catColor+'aa', border:`1px solid ${catColor}22` }}>
                                  {ing}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Acciones */}
                          <div className="flex border-t" style={{borderColor: catColor+'15'}}>
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-lo active:opacity-50"
                              style={{borderRight:`1px solid ${catColor}15`}}
                              onClick={() => {
                                setRecipes(addRecipe({
                                  name: r.name, emoji:'🍳',
                                  ingredients:[{ id:Date.now().toString(), name:r.name, grams:100,
                                    per100:{ calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat } }],
                                  per100:{ calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat }, totalGrams:100
                                }))
                                alert('✓ Guardada en mis recetas')
                              }}>
                              <Plus size={12} weight="bold"/> Guardar
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold active:opacity-50"
                              style={{color: catColor}}
                              onClick={() => {
                                addMeal({ name:r.name, calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat })
                                alert('✓ Registrado en comidas de hoy')
                              }}>
                              <ForkKnife size={12} weight="bold"/> Registrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Hero */}
            {heroMeal ? (
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: currentMeal ? `linear-gradient(135deg,${ambito.color}22,${ambito.color}08)` : `linear-gradient(135deg,#111820,#0d0d0d)`,
                  border:`1px solid ${ambito.color}${currentMeal?'60':'25'}`,
                  boxShadow: currentMeal ? `0 0 30px ${ambito.color}20` : 'none',
                }}>
                <div className="px-5 pt-4 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:ambito.color+(currentMeal?'':'80') }}>
                    {currentMeal ? <span className="flex items-center gap-1"><ForkKnife size={11}/>Comiendo ahora</span> : <span className="flex items-center gap-1"><Timer size={11}/>Siguiente comida</span>}
                  </p>
                </div>
                <div className="px-5 pb-5 flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-[28px] font-black text-hi leading-tight">{heroMeal.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[15px] font-semibold" style={{ color:ambito.color }}>{fmt12(heroMeal.time)}</span>
                      {!currentMeal && <span className="text-[13px] text-lo">{fmtCountdown(minsUntil(heroMeal.time))}</span>}
                    </div>
                    {logsFor(heroMeal.id).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {logsFor(heroMeal.id).map(m=>(
                          <span key={m.id} className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor:ambito.color+'15', color:ambito.color+'cc' }}>
                            {m.name}{m.calories>0?` · ${m.calories}kcal`:''}
                          </span>
                        ))}
                      </div>
                    ) : (heroMeal.foods||[]).length > 0 ? (
                      <div className="mt-2">
                        <p className="text-[10px] text-lo uppercase tracking-wider mb-1">Menú planificado</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(heroMeal.foods||[]).map(f=>(
                            <span key={f.id} className="text-[11px] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor:'#ffffff08', border:'1px solid #2a2a2a', color:'#666' }}>
                              {f.name}{f.calories>0?` · ${f.calories}kcal`:''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] text-lo mt-1">Sin registrar aún</p>
                    )}
                  </div>
                  <button onClick={() => openFoodSearch(heroMeal)}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                    style={{ backgroundColor:ambito.color, color:'#000', boxShadow:`0 4px 16px ${ambito.color}50` }}>
                    <Plus size={13} weight="bold"/> Registrar
                  </button>
                </div>
              </div>
            ) : todayPlan.length > 0 ? (
              <div className="card text-center py-8">
                <Sparkle size={32} className="mx-auto mb-2" style={{color:'#c9a227'}} weight="fill"/>
                <p className="text-[14px] font-bold text-hi">¡Listo por hoy!</p>
                <p className="text-[12px] text-lo mt-1">Todas las comidas del día completadas</p>
              </div>
            ) : (
              <div className="card text-center py-8">
                <p className="text-[13px] text-lo mb-2">Sin comidas planificadas para hoy.</p>
                <button onClick={() => { setPlanDay(todayKey); setTab('Plan') }}
                  className="btn-primary text-[12px]">Configurar plan</button>
              </div>
            )}

            {/* Macros */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-hi">Macros de hoy</p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: ambito.color+'20', border:`1px solid ${ambito.color}40` }}>
                      <Fire size={10} weight="fill" style={{ color: ambito.color }}/>
                      <span className="text-[10px] font-bold font-mono" style={{ color: ambito.color }}>{streak}d</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Fire size={14} style={{ color:ambito.color }}/>
                  <span className="text-[13px] font-bold font-mono" style={{ color:ambito.color }}>{totals.calories}</span>
                  <span className="text-[11px] text-lo">/ {goals.calories} kcal</span>
                </div>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${calPct}%`, background:`linear-gradient(90deg,${ambito.color},#e07c4a)` }}/>
              </div>
              <div className="space-y-2">
                <MacroBar label="Proteína"      value={totals.protein} goal={goals.protein} color="#5b84e8"/>
                <MacroBar label="Carbohidratos" value={totals.carbs}   goal={goals.carbs}   color="#c9a227"/>
                <MacroBar label="Grasas"        value={totals.fat}     goal={goals.fat}     color="#e07c4a"/>
              </div>
            </div>

            {/* Tendencias semanales */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-hi">Esta semana</p>
                <div className="flex items-center gap-1.5 text-[11px] text-lo">
                  <span>Prom: </span>
                  <span className="font-mono font-bold" style={{ color: ambito.color }}>
                    {Math.round(weekTrend.filter(d=>d.cals>0).reduce((a,d)=>a+d.cals,0) / Math.max(1, weekTrend.filter(d=>d.cals>0).length))} kcal
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={weekTrend} barSize={24} margin={{ top:4, right:0, bottom:0, left:0 }}>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="text-[11px] px-2 py-1 rounded-lg" style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a', color:'#ccc' }}>
                        {payload[0].payload.date}<br/>
                        <span style={{ color: ambito.color }}>{payload[0].value} kcal</span>
                      </div>
                    ) : null}
                  />
                  {goals.calories > 0 && <ReferenceLine y={goals.calories} stroke={ambito.color} strokeDasharray="3 3" strokeOpacity={0.4}/>}
                  <Bar dataKey="cals" radius={[4,4,0,0]}>
                    {weekTrend.map((d, i) => (
                      <Cell key={i} fill={d.cals === 0 ? '#1a1a1a' : d.isToday ? ambito.color : d.cals >= (goals.calories*0.85) ? '#4cae8a' : ambito.color+'80'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-1 px-1">
                {weekTrend.map((d, i) => (
                  <span key={i} className="text-[9px] font-bold w-6 text-center"
                    style={{ color: d.isToday ? ambito.color : '#444' }}>{d.label}</span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {todayPlan.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Plan de hoy</p>
                <div className="space-y-1.5">
                  {todayPlan.map((pm, i) => {
                    const logged    = logsFor(pm.id)
                    const isPast    = toMins(pm.time) < nowMins - 30
                    const isCurrent = currentMeal?.id === pm.id
                    const isNext    = nextMeal?.id === pm.id && !currentMeal
                    const mealCals  = logged.reduce((a,m)=>a+(Number(m.calories)||0),0)
                    return (
                      <div key={pm.id} className="rounded-xl overflow-hidden transition-all"
                        style={{
                          border: isCurrent ? `1px solid ${ambito.color}60` : isNext ? `1px solid ${ambito.color}30` : '1px solid #1a1a1a',
                          backgroundColor: isCurrent ? ambito.color+'10' : isNext ? ambito.color+'06' : 'transparent',
                        }}>
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor:logged.length>0?ambito.color+'25':'#111', border:`1px solid ${logged.length>0?ambito.color+'60':'#242424'}` }}>
                            {logged.length>0
                              ? <Check size={11} color={ambito.color} weight="bold"/>
                              : <span className="text-[9px] font-bold" style={{ color:isCurrent||isNext?ambito.color:'#333' }}>{i+1}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold"
                                style={{ color:isCurrent||isNext?'#fff':isPast&&!logged.length?'#444':'#888' }}>
                                {pm.name}
                              </p>
                              {(isCurrent||isNext) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                  style={{ backgroundColor:ambito.color+'25', color:ambito.color }}>
                                  {isCurrent?'Ahora':'Siguiente'}
                                </span>
                              )}
                            </div>
                            {logged.length>0 && (
                              <p className="text-[11px] text-lo truncate">{logged.map(m=>m.name).join(', ')}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] font-mono" style={{ color:isCurrent||isNext?ambito.color:'#555' }}>{fmt12(pm.time)}</p>
                            {mealCals>0 && <p className="text-[10px] text-lo">{mealCals} kcal</p>}
                          </div>
                          <button onClick={() => openFoodSearch(pm)}
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ backgroundColor:isCurrent||isNext?ambito.color+'20':'#111', border:`1px solid ${isCurrent||isNext?ambito.color+'40':'#242424'}`, color:isCurrent||isNext?ambito.color:'#555' }}>
                            <Plus size={12}/>
                          </button>
                        </div>
                        {logged.length>0 && (
                          <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
                            {logged.map(m=>(
                              <div key={m.id} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg group"
                                style={{ backgroundColor:'#ffffff08', border:'1px solid #1e1e1e' }}>
                                <span className="text-mid">{m.name}</span>
                                {m.calories>0&&<span className="text-lo">{m.calories}kcal</span>}
                                {m.protein>0&&<span style={{ color:'#5b84e8' }}>P{m.protein}g</span>}
                                <button onClick={()=>setMeals(deleteMeal(m.id))}
                                  className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                                  <X size={9}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PLAN SEMANAL ─────────────────────────────────────────────────── */}
        {tab === 'Plan' && (
          <div>
            {/* Day selector strip */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {WEEK_DAYS.map(d => {
                const count    = (weekPlan[d.key]||[]).length
                const isToday  = d.key === todayKey
                const isSelected = d.key === planDay
                return (
                  <button key={d.key} onClick={() => setPlanDay(d.key)}
                    className="flex-1 min-w-[52px] flex flex-col items-center py-2.5 rounded-xl transition-all"
                    style={isSelected
                      ? { backgroundColor:ambito.color+'22', border:`2px solid ${ambito.color}60` }
                      : { backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a' }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color:isSelected?ambito.color:isToday?'#888':'#444' }}>
                      {d.short}
                    </span>
                    <span className="text-[11px] font-semibold mt-0.5"
                      style={{ color:isSelected?ambito.color:isToday?'#666':'#333' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selected day header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[15px] font-bold text-hi">
                  {WEEK_DAYS.find(d=>d.key===planDay)?.label}
                  {planDay===todayKey && <span className="text-[11px] text-lo ml-2">(hoy)</span>}
                </h2>
                <p className="text-[11px] text-lo">{selectedDayPlan.length} comidas</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCopyFrom(true)}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg text-lo hover:text-mid border border-border hover:border-border-2 transition-colors">
                  <Copy size={12}/> Copiar de...
                </button>
                <button onClick={() => { setMealForm({ name:'', time:'08:00' }); setShowAddMeal(true) }}
                  className="btn-primary flex items-center gap-1.5 text-[12px]">
                  <Plus size={13} weight="bold"/> Comida
                </button>
              </div>
            </div>

            {/* Meals list for selected day */}
            {selectedDayPlan.length === 0 && (
              <div className="card py-10 text-center">
                <p className="text-[13px] text-lo mb-2">Sin comidas para este día.</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => { setMealForm({ name:'', time:'08:00' }); setShowAddMeal(true) }}
                    className="btn-primary text-[12px]">+ Agregar</button>
                  <button onClick={() => setShowCopyFrom(true)}
                    className="btn-ghost text-[12px]">Copiar de otro día</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {selectedDayPlan.map(pm => (
                editMeal?.meal.id === pm.id && editMeal?.dayKey === planDay ? (
                  // Inline edit
                  <div key={pm.id} className="card space-y-3"
                    style={{ border:`1px solid ${ambito.color}40` }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="field-label">Nombre</span>
                        <input className="field-input" value={editMeal.meal.name}
                          onChange={e => setEditMeal(em=>({...em, meal:{...em.meal, name:e.target.value}}))} autoFocus/>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {QUICK_NAMES.map(n=>(
                            <button key={n} onClick={() => setEditMeal(em=>({...em, meal:{...em.meal, name:n}}))}
                              className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                              style={{ backgroundColor:ambito.color+'12', color:ambito.color+'99', border:`1px solid ${ambito.color}20` }}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="field-label">Hora</span>
                        <input type="time" className="field-input" value={editMeal.meal.time}
                          onChange={e => setEditMeal(em=>({...em, meal:{...em.meal, time:e.target.value}}))}/>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost flex-1 text-[12px]" onClick={() => setEditMeal(null)}>Cancelar</button>
                      <button className="btn-primary flex-1 text-[12px]" onClick={saveEditMeal}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <div key={pm.id} className="card hover:border-border-2 transition-colors">
                    <div className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{backgroundColor:'#ffffff08'}}>
                        <ForkKnife size={16} className="text-lo"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-hi">{pm.name}</p>
                        <p className="text-[12px] text-lo flex items-center gap-1">
                          <Clock size={11}/> {fmt12(pm.time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openPlanFoodSearch(planDay, pm)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: ambito.color+'15', color: ambito.color, border:`1px solid ${ambito.color}30` }}>
                          <Plus size={11} weight="bold"/> Menú
                        </button>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditMeal({ dayKey:planDay, meal:{...pm} })}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg text-lo hover:text-mid border border-border hover:border-border-2 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => deleteMealFromPlan(planDay, pm.id)}
                            className="btn-icon text-lo hover:text-red-400">
                            <X size={13}/>
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Alimentos planificados */}
                    {(pm.foods||[]).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1.5">
                        {(pm.foods||[]).map(f => (
                          <div key={f.id} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg group/food"
                            style={{ backgroundColor:'#ffffff06', border:'1px solid #1e1e1e' }}>
                            <span className="text-mid">{f.name}</span>
                            {f.calories>0 && <span className="text-lo">{f.calories}kcal</span>}
                            {f.protein>0  && <span style={{ color:'#5b84e8' }}>P{f.protein}g</span>}
                            <button onClick={() => removePlanFood(planDay, pm.id, f.id)}
                              className="opacity-0 group-hover/food:opacity-100 text-lo hover:text-red-400 transition-all ml-0.5">
                              <X size={9}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>

            {/* Copy to all button */}
            {selectedDayPlan.length > 0 && (
              <button onClick={() => { if(confirm(`¿Copiar el plan de ${WEEK_DAYS.find(d=>d.key===planDay)?.label} a todos los días?`)) copyDayToAll(planDay) }}
                className="w-full mt-4 py-2.5 rounded-xl text-[12px] text-lo hover:text-mid border border-dashed border-border hover:border-border-2 transition-all flex items-center justify-center gap-2">
                <Copy size={13}/> Aplicar este plan a toda la semana
              </button>
            )}
          </div>
        )}

        {/* ── CALENDARIO ───────────────────────────────────────────────────── */}
        {tab === 'Historial' && (
          <HistorialTab ambito={ambito} meals={meals} goals={goals} onDelete={id => setMeals(deleteMeal(id))}/>
        )}

        {/* ── ALIMENTOS ────────────────────────────────────────────────────── */}
        {tab === 'Alimentos' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-[#111] rounded-xl p-1 mb-4">
              {[['biblioteca','Biblioteca'],['recetas','Recetas']].map(([k,l]) => (
                <button key={k} onClick={() => setFoodSubTab(k)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={foodSubTab===k ? { backgroundColor:ambito.color, color:'#000' } : { color:'#555' }}>
                  {l}
                </button>
              ))}
            </div>

            {/* ── Biblioteca ── */}
            {foodSubTab === 'biblioteca' && (<>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-hi">Mi biblioteca</h2>
                <p className="text-[11px] text-lo">{foodLib.length} alimentos guardados</p>
              </div>
              <button onClick={() => { setFoodForm({ name:'', emoji:'🍽', per100:{ calories:'', protein:'', carbs:'', fat:'' }, useServing:false, servingUnit:'', servingGrams:'' }); setShowAddFood(true) }}
                className="btn-primary flex items-center gap-1.5 text-[12px]">
                <Plus size={13} weight="bold"/> Agregar
              </button>
            </div>

            {foodLib.length === 0 && (
              <div className="card py-10 text-center">
                <ForkKnife size={32} className="mx-auto mb-2 text-lo" weight="duotone"/>
                <p className="text-[13px] text-lo">Tu biblioteca está vacía.</p>
                <p className="text-[12px] text-lo mt-1">Agrega tus alimentos frecuentes con sus macros.</p>
              </div>
            )}

            <div className="space-y-2">
              {foodLib.map(f => (
                <div key={f.id} className="card card-hover flex items-center gap-3 group">
                  <ForkKnife size={20} className="shrink-0 text-lo" weight="duotone"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-hi">{f.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color:MACRO_COLORS.calories }}>{f.per100.calories}kcal</span>
                      <span className="text-[10px]" style={{ color:MACRO_COLORS.protein }}>P:{f.per100.protein}g</span>
                      <span className="text-[10px]" style={{ color:MACRO_COLORS.carbs }}>C:{f.per100.carbs}g</span>
                      <span className="text-[10px]" style={{ color:MACRO_COLORS.fat }}>G:{f.per100.fat}g</span>
                      <span className="text-[10px] text-lo">/ 100g</span>
                    </div>
                  </div>
                  <button onClick={() => setFoodLib(deleteFoodFromLibrary(f.id))}
                    className="btn-icon text-lo hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash size={13}/>
                  </button>
                </div>
              ))}
            </div>
            </>)}

            {/* ── Recetas ── */}
            {foodSubTab === 'recetas' && (
              <div className="space-y-4">

                {/* Mis recetas personales */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-[14px] font-semibold text-hi">Mis recetas</h2>
                      <p className="text-[11px] text-lo">{recipes.length} recetas guardadas</p>
                    </div>
                    <button onClick={() => { setRecipeForm({ name:'', emoji:'🍳', ingredients:[] }); setRecipeIngSearch(''); setShowRecipeForm(true) }}
                      className="btn-primary flex items-center gap-1.5 text-[12px]">
                      <Plus size={13} weight="bold"/> Nueva
                    </button>
                  </div>
                  {recipes.length === 0 ? (
                    <div className="card py-6 text-center">
                      <Cookie size={28} className="mx-auto mb-2 text-lo" weight="duotone"/>
                      <p className="text-[12px] text-lo">Sin recetas propias aún.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recipes.map(r => {
                        const totalG    = r.ingredients.reduce((a,i)=>a+i.grams,0)
                        const totalCal  = r.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.calories||0)/100),0)
                        const totalProt = r.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.protein||0)/100),0)
                        return (
                          <div key={r.id} className="card group hover:border-border-2 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[20px] shrink-0">{r.emoji||'🍳'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-hi">{r.name}</p>
                                <div className="flex gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px]" style={{color:MACRO_COLORS.calories}}>{Math.round(totalCal)}kcal</span>
                                  <span className="text-[10px]" style={{color:MACRO_COLORS.protein}}>P:{Math.round(totalProt)}g</span>
                                  <span className="text-[10px] text-lo">{totalG}g · {r.ingredients.length} ingredientes</span>
                                </div>
                              </div>
                              <button onClick={() => setRecipes(deleteRecipe(r.id))}
                                className="btn-icon text-lo hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash size={13}/>
                              </button>
                            </div>
                            {r.ingredients.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-border">
                                {r.ingredients.map((ing,i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{backgroundColor:'#ffffff08',border:'1px solid #1e1e1e',color:'#666'}}>
                                    {ing.name} {ing.grams}g
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div className="border-t border-border pt-4">
                  <h2 className="text-[14px] font-semibold text-hi mb-1">Repertorio</h2>
                  <p className="text-[11px] text-lo mb-3">{PRESET_RECIPES.length} ideas rápidas · filtra por momento del día</p>

                  {/* Filtro categoría */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {['Todas','Desayuno','Colación','Comida','Snack','Cena'].map(cat => {
                      const CatIcon = CAT_ICONS[cat]
                      const color = CAT_COLORS[cat]||'#2cb99a'
                      const active = recipeFilter === cat
                      return (
                        <button key={cat} onClick={() => setRecipeFilter(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                          style={active
                            ? { backgroundColor: color+'22', color, border:`1px solid ${color}44` }
                            : { backgroundColor:'#111', color:'#555', border:'1px solid #1a1a1a' }}>
                          {CatIcon && <CatIcon size={11} weight={active?'fill':'regular'}/>}
                          {cat}
                        </button>
                      )
                    })}
                  </div>

                  {/* Búsqueda */}
                  <input className="field-input mb-3 text-[12px]"
                    placeholder="Buscar receta…"
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}/>

                  {/* Lista */}
                  <div className="space-y-2">
                    {PRESET_RECIPES
                      .filter(r => recipeFilter === 'Todas' || r.cat === recipeFilter)
                      .filter(r => !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                      .map((r, i) => {
                        const color = CAT_COLORS[r.cat] || '#888'
                        const CatI = CAT_ICONS[r.cat]
                        const isOpen = expandedPreset === i
                        return (
                          <div key={i} className="rounded-xl overflow-hidden"
                            style={{backgroundColor:'#0a0a0a', border:`1px solid ${isOpen ? color+'44' : '#1a1a1a'}`}}>
                            {/* Cabecera — tap para expandir */}
                            <button className="w-full text-left px-3 py-2.5"
                              onClick={() => setExpandedPreset(isOpen ? null : i)}>
                              <div className="flex items-start gap-2">
                                {CatI && <CatI size={13} weight="regular" className="mt-0.5 shrink-0" style={{color}}/>}
                                <p className="text-[12px] text-hi flex-1 leading-tight">{r.name}</p>
                                {/* Guardar como receta */}
                                <span onClick={e => { e.stopPropagation(); setRecipes(addRecipe({ name:r.name, emoji:'🍳', ingredients:[{ id:Date.now().toString(), name:r.name, grams:100, per100:{ calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat } }], per100:{ calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat }, totalGrams:100 })); alert('✓ Guardada en mis recetas') }}
                                  className="shrink-0 p-1 rounded-lg" style={{color:'#555'}}>
                                  <Plus size={13} weight="bold"/>
                                </span>
                                {/* Registrar como comida hoy */}
                                <span onClick={e => { e.stopPropagation(); addMeal({ name:r.name, calories:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat }); alert('✓ Registrado en comidas de hoy') }}
                                  className="shrink-0 p-1 rounded-lg" style={{color: ambito.color}}>
                                  <ForkKnife size={13} weight="bold"/>
                                </span>
                              </div>
                              {/* Macros */}
                              {r.kcal && (
                                <div className="flex gap-3 mt-1.5 ml-5">
                                  <span className="text-[10px] font-semibold" style={{color:'#e07c4a'}}>{r.kcal} kcal</span>
                                  <span className="text-[10px]" style={{color:'#5b84e8'}}>P {r.protein}g</span>
                                  <span className="text-[10px]" style={{color:'#c9a227'}}>C {r.carbs}g</span>
                                  <span className="text-[10px]" style={{color:'#4cae8a'}}>G {r.fat}g</span>
                                </div>
                              )}
                            </button>
                            {/* Ingredientes (expandible) */}
                            {isOpen && r.ingredients && r.ingredients.length > 0 && (
                              <div className="px-3 pb-3 pt-0 border-t" style={{borderColor: color+'22'}}>
                                <p className="text-[10px] font-semibold mb-1.5 mt-2" style={{color}}>Ingredientes</p>
                                <ul className="space-y-1">
                                  {r.ingredients.map((ing, j) => (
                                    <li key={j} className="flex items-start gap-1.5">
                                      <span className="text-[10px] mt-0.5 shrink-0" style={{color}}>·</span>
                                      <span className="text-[11px] text-mid leading-snug">{ing}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })
                    }
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Food search modal ────────────────────────────────────────────────── */}
      {showFoodSearch && (
        <FoodSearchModal
          planMeal={foodSearchFor}
          ambito={ambito}
          onClose={() => setShowFoodSearch(false)}
          onAdd={handleFoodAdd}
        />
      )}

      {/* ── Modal: Agregar alimento a biblioteca ─────────────────────────────── */}
      {showAddFood && (
        <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm" onClick={()=>setShowAddFood(false)}>
          <div className="modal-sheet bg-card border border-border-2 rounded-t-3xl w-full max-w-lg shadow-2xl"
            style={{ borderTop:`3px solid ${ambito.color}` }}
            onClick={e=>e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/10"/></div>
            <div className="px-5 pt-2 pb-5 overflow-y-auto max-h-[85vh]">
              <h3 className="font-semibold text-hi mb-4 text-[15px]">Nuevo alimento</h3>
              <div className="space-y-4">
                {/* Nombre + emoji */}
                <div className="grid grid-cols-[60px_1fr] gap-3">
                  <div>
                    <span className="field-label">Emoji</span>
                    <input className="field-input text-center text-[22px]" value={foodForm.emoji}
                      onChange={e=>setFoodForm(f=>({...f,emoji:e.target.value}))}/>
                  </div>
                  <div>
                    <span className="field-label">Nombre</span>
                    <input className="field-input" placeholder="Ej: Mi proteína, Tortilla casera..."
                      value={foodForm.name} onChange={e=>setFoodForm(f=>({...f,name:e.target.value}))} autoFocus/>
                  </div>
                </div>

                {/* Macros por 100g */}
                <div>
                  <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Macros por 100g</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[{k:'calories',l:'Calorías (kcal)',c:MACRO_COLORS.calories},{k:'protein',l:'Proteína (g)',c:MACRO_COLORS.protein},{k:'carbs',l:'Carbos (g)',c:MACRO_COLORS.carbs},{k:'fat',l:'Grasas (g)',c:MACRO_COLORS.fat}].map(({k,l,c})=>(
                      <div key={k}>
                        <span className="field-label" style={{ color:c }}>{l}</span>
                        <input type="number" min={0} className="field-input" placeholder="0"
                          value={foodForm.per100[k]} onChange={e=>setFoodForm(f=>({...f,per100:{...f.per100,[k]:Number(e.target.value)||0}}))}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Porción personalizada */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-hi">Porción personalizada</p>
                      <p className="text-[11px] text-lo">Opcional — para contar por piezas, vasos, etc.</p>
                    </div>
                    <button
                      onClick={() => setFoodForm(f => ({
                        ...f,
                        useServing: !f.useServing,
                        servingUnit: f.servingUnit || 'pieza',
                        servingGrams: f.servingGrams || 100,
                      }))}
                      className="w-10 h-5 rounded-full transition-all relative"
                      style={{ backgroundColor: foodForm.useServing ? ambito.color : '#2a2a2a' }}>
                      <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                        style={{ left: foodForm.useServing ? 22 : 2 }}/>
                    </button>
                  </div>

                  {foodForm.useServing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="field-label">Nombre de la unidad</span>
                        <input className="field-input" placeholder="tortilla, vaso, pieza..."
                          value={foodForm.servingUnit||''}
                          onChange={e=>setFoodForm(f=>({...f,servingUnit:e.target.value}))}/>
                        {/* Quick suggestions */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['pieza','tortilla','vaso','taza','cucharada','rebanada','porción'].map(u=>(
                            <button key={u} onClick={()=>setFoodForm(f=>({...f,servingUnit:u}))}
                              className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                              style={{ backgroundColor:ambito.color+'12', color:ambito.color+'99', border:`1px solid ${ambito.color}20` }}>
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="field-label">Gramos por unidad</span>
                        <input type="number" min={1} className="field-input" placeholder="ej: 35"
                          value={foodForm.servingGrams||''}
                          onChange={e=>setFoodForm(f=>({...f,servingGrams:Number(e.target.value)||0}))}/>
                        {foodForm.servingUnit && foodForm.servingGrams > 0 && (
                          <p className="text-[10px] text-lo mt-1">
                            1 {foodForm.servingUnit} = {foodForm.servingGrams}g
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button className="btn-ghost flex-1" onClick={()=>setShowAddFood(false)}>Cancelar</button>
                <button className="btn-primary flex-1" onClick={()=>{
                  if (!foodForm.name.trim()) return
                  const food = {
                    name: foodForm.name.trim(),
                    emoji: foodForm.emoji,
                    per100: foodForm.per100,
                    ...(foodForm.useServing && foodForm.servingUnit && foodForm.servingGrams > 0
                      ? { servingUnit: foodForm.servingUnit, servingGrams: foodForm.servingGrams }
                      : {})
                  }
                  setFoodLib(addFoodToLibrary(food))
                  setShowAddFood(false)
                }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Agregar comida al plan ─────────────────────────────────────── */}
      {showAddMeal && (
        <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={()=>setShowAddMeal(false)}>
          <div className="modal-dialog bg-card border border-border-2 rounded-2xl p-5 w-[340px] shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-1 text-[15px]">Nueva comida</h3>
            <p className="text-[12px] text-lo mb-4">{WEEK_DAYS.find(d=>d.key===planDay)?.label}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="field-label">Nombre</span>
                <input className="field-input" placeholder="Ej: Merienda"
                  value={mealForm.name} onChange={e=>setMealForm(f=>({...f,name:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&addMealToPlan(planDay)} autoFocus/>
              </div>
              <div>
                <span className="field-label">Hora</span>
                <input type="time" className="field-input" value={mealForm.time}
                  onChange={e=>setMealForm(f=>({...f,time:e.target.value}))}/>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {QUICK_NAMES.map(n=>(
                <button key={n} onClick={()=>setMealForm(f=>({...f,name:n}))}
                  className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                  style={{ backgroundColor:ambito.color+'12', color:ambito.color+'bb', border:`1px solid ${ambito.color}25` }}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={()=>setShowAddMeal(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={()=>addMealToPlan(planDay)}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Copiar de otro día ─────────────────────────────────────────── */}
      {showCopyFrom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={()=>setShowCopyFrom(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-5 w-[320px] shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-1 text-[15px]">Copiar plan de...</h3>
            <p className="text-[12px] text-lo mb-4">→ {WEEK_DAYS.find(d=>d.key===planDay)?.label}</p>
            <div className="space-y-1.5">
              {WEEK_DAYS.filter(d=>d.key!==planDay).map(d=>{
                const count=(weekPlan[d.key]||[]).length
                return (
                  <button key={d.key} onClick={()=>copyDayTo(d.key, planDay)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-all hover:bg-white/5">
                    <span className="text-[13px] font-semibold text-hi">{d.label}</span>
                    <span className="text-[11px] text-lo">{count} comidas</span>
                  </button>
                )
              })}
            </div>
            <button className="btn-ghost w-full mt-3 text-[12px]" onClick={()=>setShowCopyFrom(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Modal: Metas ─────────────────────────────────────────────────────── */}
      {showGoals && (
        <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={()=>setShowGoals(false)}>
          <div className="modal-dialog bg-card border border-border-2 rounded-2xl p-5 w-[340px] shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Metas diarias</h3>
            <div className="space-y-3">
              {[{k:'calories',l:'Calorías (kcal)',c:ambito.color},{k:'protein',l:'Proteína (g)',c:'#5b84e8'},{k:'carbs',l:'Carbohidratos (g)',c:'#c9a227'},{k:'fat',l:'Grasas (g)',c:'#e07c4a'}].map(({k,l,c})=>(
                <div key={k}><span className="field-label" style={{ color:c }}>{l}</span>
                  <input type="number" min={0} className="field-input"
                    value={goalForm[k]} onChange={e=>setGoalForm(f=>({...f,[k]:Number(e.target.value)}))}/>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-ghost flex-1" onClick={()=>setShowGoals(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={()=>{ saveDietGoals(goalForm); setGoals(goalForm); setShowGoals(false) }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nueva Receta ───────────────────────────────────────────────── */}
      {showRecipeForm && <RecipeModal
        ambito={ambito}
        recipeForm={recipeForm}
        setRecipeForm={setRecipeForm}
        recipeIngSearch={recipeIngSearch}
        setRecipeIngSearch={setRecipeIngSearch}
        onClose={()=>setShowRecipeForm(false)}
        onSave={recipe=>{ setRecipes(addRecipe(recipe)); setShowRecipeForm(false) }}
      />}
    </div>
  )
}

// ── RecipeModal ───────────────────────────────────────────────────────────────
function RecipeModal({ ambito, recipeForm, setRecipeForm, recipeIngSearch, setRecipeIngSearch, onClose, onSave }) {
        const { personal: libMatch, db: dbMatch } = recipeIngSearch.trim()
          ? searchFoods(recipeIngSearch, getFoodLibrary())
          : { personal: [], db: [] }
        const ingResults = [...libMatch, ...dbMatch].slice(0, 8)

        const totalGrams = recipeForm.ingredients.reduce((a,i)=>a+i.grams, 0)
        const totalCal   = recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.calories||0)/100), 0)
        const totalProt  = recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.protein||0)/100), 0)
        const totalCarbs = recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.carbs||0)/100), 0)
        const totalFat   = recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.fat||0)/100), 0)

        return (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-end backdrop-blur-sm" onClick={()=>setShowRecipeForm(false)}>
            <div className="bg-card border border-border-2 rounded-t-3xl w-full max-h-[90vh] flex flex-col"
              style={{ borderTop:`3px solid ${ambito.color}` }}
              onClick={e=>e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-white/10"/></div>
              <div className="px-5 pt-2 pb-3 border-b border-border shrink-0 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-hi">Nueva receta</h3>
                <button onClick={()=>setShowRecipeForm(false)} className="p-1.5 text-lo hover:text-mid"><X size={15}/></button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Nombre + emoji */}
                <div className="grid grid-cols-[56px_1fr] gap-3">
                  <div>
                    <span className="field-label">Emoji</span>
                    <input className="field-input text-center text-[22px]" value={recipeForm.emoji}
                      onChange={e=>setRecipeForm(f=>({...f,emoji:e.target.value}))}/>
                  </div>
                  <div>
                    <span className="field-label">Nombre de la receta</span>
                    <input className="field-input" placeholder="Ej: Avena con plátano..."
                      value={recipeForm.name} onChange={e=>setRecipeForm(f=>({...f,name:e.target.value}))} autoFocus/>
                  </div>
                </div>

                {/* Buscar ingredientes */}
                <div>
                  <span className="field-label">Agregar ingrediente</span>
                  <div className="relative mt-1">
                    <input className="field-input pl-3 text-[13px]" placeholder="Buscar alimento..."
                      value={recipeIngSearch} onChange={e=>setRecipeIngSearch(e.target.value)}/>
                  </div>
                  {ingResults.length > 0 && (
                    <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto">
                      {ingResults.map(f => (
                        <button key={f.id} onClick={() => {
                          setRecipeForm(rf => ({
                            ...rf,
                            ingredients: [...rf.ingredients, { id: f.id, name: f.name, grams: 100, per100: f.per100 }]
                          }))
                          setRecipeIngSearch('')
                        }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5"
                          style={{ backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a' }}>
                          <ForkKnife size={14} className="text-lo shrink-0"/>
                          <span className="text-[12px] text-mid flex-1 truncate">{f.name}</span>
                          <span className="text-[10px]" style={{ color:MACRO_COLORS.calories }}>{f.per100.calories}kcal/100g</span>
                          <Plus size={12} style={{ color: ambito.color }}/>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ingredientes actuales */}
                {recipeForm.ingredients.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Ingredientes</p>
                    <div className="space-y-1.5">
                      {recipeForm.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a' }}>
                          <span className="text-[12px] text-mid flex-1 truncate">{ing.name}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setRecipeForm(rf=>({...rf,ingredients:rf.ingredients.map((x,j)=>j===i?{...x,grams:Math.max(1,x.grams-10)}:x)}))}
                              className="w-6 h-6 rounded-lg text-[12px] flex items-center justify-center"
                              style={{ backgroundColor:'#1a1a1a', color:'#666' }}>−</button>
                            <input type="number" min={1}
                              className="w-14 text-center bg-transparent text-[12px] font-mono font-bold outline-none"
                              style={{ color: ambito.color }}
                              value={ing.grams}
                              onChange={e=>setRecipeForm(rf=>({...rf,ingredients:rf.ingredients.map((x,j)=>j===i?{...x,grams:Number(e.target.value)||1}:x)}))}/>
                            <span className="text-[11px] text-lo">g</span>
                            <button onClick={() => setRecipeForm(rf=>({...rf,ingredients:rf.ingredients.map((x,j)=>j===i?{...x,grams:x.grams+10}:x)}))}
                              className="w-6 h-6 rounded-lg text-[12px] flex items-center justify-center"
                              style={{ backgroundColor:'#1a1a1a', color:'#666' }}>+</button>
                          </div>
                          <button onClick={() => setRecipeForm(rf=>({...rf,ingredients:rf.ingredients.filter((_,j)=>j!==i)}))}
                            className="text-lo hover:text-red-400 transition-all"><X size={12}/></button>
                        </div>
                      ))}
                    </div>
                    {/* Totales */}
                    <div className="grid grid-cols-4 mt-3 rounded-xl overflow-hidden divide-x divide-border"
                      style={{ border:`1px solid ${ambito.color}25`, backgroundColor: ambito.color+'06' }}>
                      {[
                        { l:'Kcal', v:Math.round(totalCal), c:MACRO_COLORS.calories },
                        { l:'Prot', v:Math.round(totalProt), c:MACRO_COLORS.protein },
                        { l:'Carbs', v:Math.round(totalCarbs), c:MACRO_COLORS.carbs },
                        { l:'Grasas', v:Math.round(totalFat), c:MACRO_COLORS.fat },
                      ].map(({l,v,c})=>(
                        <div key={l} className="flex flex-col items-center py-2">
                          <span className="text-[9px] text-lo uppercase tracking-wider">{l}</span>
                          <span className="text-[15px] font-black font-mono" style={{ color:c }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-lo text-center mt-1">{totalGrams}g en total</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
                <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
                <button className="btn-primary flex-1" onClick={()=>{
                  if (!recipeForm.name.trim() || recipeForm.ingredients.length === 0) return
                  const tg = recipeForm.ingredients.reduce((a,i)=>a+i.grams,0)
                  const per100 = tg > 0 ? {
                    calories: Math.round(recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.calories||0)/100),0)*100/tg),
                    protein:  Math.round(recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.protein||0)/100),0)*100/tg*10)/10,
                    carbs:    Math.round(recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.carbs||0)/100),0)*100/tg*10)/10,
                    fat:      Math.round(recipeForm.ingredients.reduce((a,i)=>a+(i.grams*(i.per100?.fat||0)/100),0)*100/tg*10)/10,
                  } : { calories:0, protein:0, carbs:0, fat:0 }
                  onSave({ name:recipeForm.name.trim(), emoji:recipeForm.emoji, ingredients:recipeForm.ingredients, per100, totalGrams:tg })
                }}>Guardar receta</button>
              </div>
            </div>
          </div>
        )
}
