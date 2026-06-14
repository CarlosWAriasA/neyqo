package com.neyqo.android.ui.accounts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.neyqo.android.data.model.Account
import com.neyqo.android.data.model.AccountType
import com.neyqo.android.data.model.CreateAccountPayload

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAccountSheet(
    editingAccount: Account?,
    isSaving: Boolean,
    saveError: String?,
    onDismiss: () -> Unit,
    onSave: (CreateAccountPayload) -> Unit,
) {
    val isEditing = editingAccount != null

    var name by remember(editingAccount) { mutableStateOf(editingAccount?.name ?: "") }
    var type by remember(editingAccount) { mutableStateOf(editingAccount?.type ?: AccountType.BANK) }
    var currency by remember(editingAccount) { mutableStateOf(editingAccount?.currency ?: "DOP") }
    var initialBalance by remember(editingAccount) {
        mutableStateOf(editingAccount?.initialBalance?.toString() ?: "0")
    }
    var description by remember(editingAccount) { mutableStateOf(editingAccount?.description ?: "") }

    var nameError by remember { mutableStateOf<String?>(null) }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = { if (!isSaving) onDismiss() },
        sheetState = sheetState,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = if (isEditing) "Editar cuenta" else "Nueva cuenta",
                style = MaterialTheme.typography.titleLarge,
            )

            Text(
                text = "Define dónde entra, sale o queda apartado tu dinero.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            // Name
            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it
                    nameError = null
                },
                label = { Text("Nombre") },
                placeholder = { Text("Cuenta de ahorro") },
                isError = nameError != null,
                supportingText = nameError?.let { { Text(it) } },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Type dropdown
            var typeExpanded by remember { mutableStateOf(false) }
            val typeLabels = AccountType.labels

            ExposedDropdownMenuBox(
                expanded = typeExpanded,
                onExpandedChange = { typeExpanded = it },
            ) {
                OutlinedTextField(
                    value = typeLabels[type] ?: type,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Tipo") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = typeExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                )
                ExposedDropdownMenu(
                    expanded = typeExpanded,
                    onDismissRequest = { typeExpanded = false },
                ) {
                    typeLabels.forEach { (value, label) ->
                        DropdownMenuItem(
                            text = { Text(label) },
                            onClick = {
                                type = value
                                typeExpanded = false
                            },
                        )
                    }
                }
            }

            // Currency dropdown
            var currencyExpanded by remember { mutableStateOf(false) }
            val currencies = listOf("DOP", "USD", "EUR")

            ExposedDropdownMenuBox(
                expanded = currencyExpanded,
                onExpandedChange = { currencyExpanded = it },
            ) {
                OutlinedTextField(
                    value = currency,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Moneda") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = currencyExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                )
                ExposedDropdownMenu(
                    expanded = currencyExpanded,
                    onDismissRequest = { currencyExpanded = false },
                ) {
                    currencies.forEach { code ->
                        DropdownMenuItem(
                            text = { Text(code) },
                            onClick = {
                                currency = code
                                currencyExpanded = false
                            },
                        )
                    }
                }
            }

            // Initial balance
            OutlinedTextField(
                value = initialBalance,
                onValueChange = { initialBalance = it },
                label = { Text("Balance inicial") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descripción") },
                placeholder = { Text("Uso principal de la cuenta") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Error
            if (saveError != null) {
                Text(
                    text = saveError,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                )
            }

            // Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedButton(
                    onClick = { if (!isSaving) onDismiss() },
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Cancelar")
                }
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            nameError = "Escribe un nombre."
                            return@Button
                        }
                        val balance = initialBalance.toDoubleOrNull() ?: 0.0
                        onSave(
                            CreateAccountPayload(
                                name = name.trim(),
                                type = type,
                                currency = currency,
                                initialBalance = balance,
                                description = description.trim().ifBlank { null },
                            )
                        )
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isSaving,
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isEditing) "Actualizar" else "Guardar")
                }
            }
        }
    }
}
